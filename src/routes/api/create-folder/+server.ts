import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createS3Client } from '$lib/server/s3_client';

// 폴더 생성 API (빈 .placeholder 파일을 통한 가상 폴더 생성)
export async function POST({ request }: RequestEvent) {
  try {
    const body = await request.json();
    const { bucketName, folderName, currentPrefix = '' } = body;
    
    // 필수 파라미터 검증
    if (!bucketName || !folderName) {
      throw error(400, '필수 파라미터가 누락되었습니다: bucketName, folderName');
    }
    
    // 폴더명 검증 (특수문자 제한)
    if (!/^[a-zA-Z0-9가-힣\-_\s]+$/.test(folderName)) {
      throw error(400, '폴더명에는 영문, 숫자, 한글, 하이픈(-), 언더스코어(_), 공백만 사용할 수 있습니다');
    }
    
    // 폴더명이 이미 존재하는지 확인 (중복 방지)
    const s3Client = createS3Client();
    const folderPrefix = currentPrefix + folderName + '/';
    
    // 해당 prefix로 시작하는 객체가 있는지 확인
    const existingObjects = await s3Client.listObjectsV2({
      Bucket: bucketName,
      Prefix: folderPrefix,
      MaxKeys: 1
    }).promise();
    
    if (existingObjects.Contents && existingObjects.Contents.length > 0) {
      throw error(409, '이미 존재하는 폴더명입니다');
    }
    
    // .placeholder 파일 생성 (빈 폴더를 S3에서 표현하는 방법)
    const placeholderKey = folderPrefix + '.placeholder';
    
    await s3Client.putObject({
      Bucket: bucketName,
      Key: placeholderKey,
      Body: '', // 빈 내용
      ContentType: 'text/plain',
      Metadata: {
        'purpose': 'folder-placeholder',
        'created-by': 'minio-clone',
        'created-at': new Date().toISOString()
      }
    }).promise();
    
    return json({
      success: true,
      message: `폴더 "${folderName}"가 생성되었습니다`,
      folderName,
      folderPrefix,
      placeholderKey
    });
    
  } catch (err: unknown) {
    console.error('폴더 생성 API 오류:', err);
    
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
      throw error(
        (err.status as number) || 500,
        (err.message as string) || '폴더를 생성하는 중 오류가 발생했습니다'
      );
    } else {
      throw error(500, '폴더를 생성하는 중 오류가 발생했습니다');
    }
  }
}
