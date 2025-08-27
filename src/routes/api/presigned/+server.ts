import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getPresignedUploadUrl, getPresignedDownloadUrl } from '$lib/s3_sdk/operations/objects/presigned';
import { getS3Client } from '$lib/stores/s3ClientStore';

// pre-signed URL 생성 API
export async function POST({ request }: RequestEvent) {
  try {
    const body = await request.json();
    const { operation, bucketName, key, contentType, expiresIn = 300 } = body;
    
    if (!operation || !bucketName || !key) {
      throw error(400, '필수 파라미터가 누락되었습니다: operation, bucketName, key');
    }
    
    const s3Client = getS3Client();
    let url = '';
    
    // 요청된 작업에 따라 pre-signed URL 생성
    if (operation === 'upload') {
      if (!contentType) {
        throw error(400, '업로드에는 contentType이 필요합니다');
      }
      url = await getPresignedUploadUrl(s3Client, bucketName, key, contentType, expiresIn);
    } else if (operation === 'download') {
      url = await getPresignedDownloadUrl(s3Client, bucketName, key, expiresIn);
    } else {
      throw error(400, '지원되지 않는 작업입니다. upload 또는 download만 가능합니다');
    }
    
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
