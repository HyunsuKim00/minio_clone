import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createS3Client } from '$lib/server/s3_client';

// 폴더 내 파일 목록 조회 API (다운로드용)
export async function POST({ request }: RequestEvent) {
  try {
    const { bucketName, folderPrefix } = await request.json();
    
    if (!bucketName || !folderPrefix) {
      throw error(400, '필수 파라미터가 누락되었습니다: bucketName, folderPrefix');
    }
    
    const s3Client = createS3Client();
    const files: string[] = [];
    
    let continuationToken: string | undefined;
    
    // 폴더 내 모든 파일 조회 (재귀적으로)
    do {
      const data = await s3Client.listObjectsV2({
        Bucket: bucketName,
        Prefix: folderPrefix,
        ContinuationToken: continuationToken
      }).promise();
      
      if (data.Contents) {
        const folderFiles = data.Contents
          .filter(obj => obj.Key && !obj.Key.endsWith('.placeholder'))
          .map(obj => obj.Key!);
        
        files.push(...folderFiles);
      }
      
      continuationToken = data.NextContinuationToken;
    } while (continuationToken);
    
    return json({
      success: true,
      files,
      totalFiles: files.length
    });
    
  } catch (err: unknown) {
    console.error('폴더 파일 목록 조회 오류:', err);
    throw error(500, '폴더 파일 목록 조회 중 오류가 발생했습니다');
  }
}
