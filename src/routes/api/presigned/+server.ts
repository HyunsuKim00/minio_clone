import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createS3Client } from '$lib/server/s3_client'

// pre-signed URL 생성 API
export async function POST({ request }: RequestEvent) {
  try {
    const body = await request.json();
    const { operation, bucketName, key, contentType, expiresIn = 300 } = body;
    
    if (!operation || !bucketName || !key) {
      throw error(400, '필수 파라미터가 누락되었습니다: operation, bucketName, key');
    }
    
    // 요청된 작업 검증
    if (operation !== 'upload' && operation !== 'download') {
      throw error(400, '지원되지 않는 작업입니다. upload 또는 download만 가능합니다');
    }
    
    // 업로드 작업에서 contentType이 없으면 기본값 사용
    const finalContentType = operation === 'upload' 
      ? (contentType || 'application/octet-stream') 
      : contentType;
    
    const s3Client = createS3Client();
    
    // S3 파라미터 설정
    const params = {
      Bucket: bucketName,
      Key: key,
      Expires: expiresIn,
      ...(operation === 'upload' ? { ContentType: finalContentType } : {})
    };
    
    // S3 SDK를 사용하여 직접 presigned URL 생성
    const url = await s3Client.getSignedUrlPromise(
      operation === 'upload' ? 'putObject' : 'getObject', 
      params
    );
    
    return json({
      success: true,
      url,
      operation,
      bucketName,
      key,
      expiresIn
    });
    
  } catch (err: unknown) {
    console.error('Pre-signed URL 생성 중 오류:', err);
    
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
      throw error(
        (err.status as number) || 500,
        (err.message as string) || 'Pre-signed URL을 생성하는 중 오류가 발생했습니다'
      );
    } else {
      throw error(500, 'Pre-signed URL을 생성하는 중 오류가 발생했습니다');
    }
  }
}