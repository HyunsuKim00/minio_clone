import { error, redirect, fail } from '@sveltejs/kit';
import { createS3Client } from '$lib/server/s3_client';
import { listDirectory } from '$lib/server/listObjects';
import type { PageServerLoad } from './$types';
import type { Actions } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const { bucketName, objectName } = params;
  
  if (!bucketName || !objectName) {
    throw error(400, '버킷 이름과 오브젝트 이름이 필요합니다');
  }
  
  // URL 디코딩 (한글 파일명 지원)
  const decodedObjectName = decodeURIComponent(objectName);
  
  // 파일 경로에서 현재 파일이 속한 폴더의 prefix 계산
  const lastSlashIndex = decodedObjectName.lastIndexOf('/');
  const currentPrefix = lastSlashIndex >= 0 ? decodedObjectName.substring(0, lastSlashIndex + 1) : '';
  
  // S3 클라이언트 생성
  const s3Client = createS3Client();
  
  // 현재 prefix의 directory 정보 로드 (폴더 구조 유지를 위해)
  const directoryData = await listDirectory(s3Client, bucketName, currentPrefix);
  
  // 요청된 오브젝트가 실제로 존재하는지 확인 (파일만)
  const selectedObject = directoryData.items.find(item => 
    'key' in item && item.key === decodedObjectName
  ) as import('$lib/server/types').ObjectInfo | undefined;
  
  if (!selectedObject) {
    // 에러 대신 현재 폴더로 리디렉션
    const redirectUrl = currentPrefix 
      ? `/browser/${bucketName}?prefix=${encodeURIComponent(currentPrefix)}`
      : `/browser/${bucketName}`;
    throw redirect(303, redirectUrl);
  }
  
  // 선택된 객체의 상세 메타데이터 가져오기
  let metadata = null;
  try {
    metadata = await s3Client.headObject({
      Bucket: bucketName,
      Key: decodedObjectName
    }).promise();
    
  } catch (metaError) {
    console.warn('⚠️ 메타데이터 조회 실패 (선택적 기능이므로 계속 진행):', metaError);
    // 메타데이터 조회 실패는 페이지 로드를 막지 않음
  }
  
  // 총 파일 크기 계산 (파일들만)
  const fileItems = directoryData.items.filter(item => 'key' in item);
  const totalSize = fileItems.reduce((sum, item) => sum + (item.size || 0), 0);
  
  return {
    selectedObject,
    bucketName,
    objectName: decodedObjectName,
    // 폴더 구조가 유지된 directory 데이터 전달
    directory: directoryData,
    currentPrefix,
    totalSize,
    objectCount: fileItems.length,
    metadata // Raw 메타데이터 전달
  };
};

export const actions: Actions = {  
  deleteObject: async ({ request, params }) => {
    const { bucketName } = params;
    
    try {
        const formData = await request.formData();
        const keyValue = formData.get('key');
        
        if (!keyValue) {
            return fail(400, { success: false, message: '객체 키가 필요합니다' });
        }
        
        // S3 클라이언트 생성 및 객체 삭제
        const s3Client = createS3Client();
        await s3Client.deleteObject({
            Bucket: bucketName as string,  // 타입 단언으로 오류 해결
            Key: keyValue.toString()
        }).promise();
        
        return { success: true };
    } catch (err) {
        console.error('객체 삭제 중 오류:', err);
        return fail(500, { 
            success: false, 
            message: err instanceof Error ? err.message : '객체 삭제 중 오류가 발생했습니다' 
        });
    }
  }
}