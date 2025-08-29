import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createS3Client } from '$lib/server/s3_client';

// 혼합 삭제 API (파일 + 폴더를 함께 삭제)
export async function POST({ request }: RequestEvent) {
  try {
    const body = await request.json();
    const { bucketName, fileKeys = [], folderPrefixes = [] } = body;
    
    // 필수 파라미터 검증
    if (!bucketName || (fileKeys.length === 0 && folderPrefixes.length === 0)) {
      throw error(400, '필수 파라미터가 누락되었습니다: bucketName, fileKeys 또는 folderPrefixes');
    }
    
    // 총 아이템 개수 제한 (성능 고려)
    if (fileKeys.length + folderPrefixes.length > 50) {
      throw error(400, '한 번에 삭제할 수 있는 항목은 최대 50개입니다');
    }
    
    const s3Client = createS3Client();
    const objectsToDelete: string[] = [];
    
    // 1. 개별 파일들 추가
    objectsToDelete.push(...fileKeys);
    
    // 2. 폴더들의 모든 파일 조회 및 추가
    for (const folderPrefix of folderPrefixes) {
      const listParams = {
        Bucket: bucketName,
        Prefix: folderPrefix
      };
      
      let continuationToken: string | undefined;
      
      do {
        const data = await s3Client.listObjectsV2({
          ...listParams,
          ContinuationToken: continuationToken
        }).promise();
        
        if (data.Contents) {
          // 폴더 내 모든 파일 추가 (.placeholder 포함)
          const folderFiles = data.Contents
            .filter(obj => obj.Key)
            .map(obj => obj.Key!);
          
          objectsToDelete.push(...folderFiles);
        }
        
        continuationToken = data.NextContinuationToken;
      } while (continuationToken);
    }
    
    if (objectsToDelete.length === 0) {
      throw error(404, '삭제할 파일이 없습니다');
    }
    
    // MinIO 호환성을 위해 개별 삭제 사용
    let deletedCount = 0;
    const errors: string[] = [];
    
    for (const objectKey of objectsToDelete) {
      try {
        await s3Client.deleteObject({
          Bucket: bucketName,
          Key: objectKey
        }).promise();
        
        deletedCount++;
      } catch (deleteError) {
        console.error(`❌ 객체 삭제 실패: ${objectKey}`, deleteError);
        errors.push(objectKey);
      }
    }
    
    // 일부 삭제 실패가 있으면 오류 보고
    if (errors.length > 0) {
      console.error(`일부 객체 삭제 실패: ${errors.join(', ')}`);
      throw error(500, `일부 객체 삭제에 실패했습니다: ${errors.length}개`);
    }
    
    return json({
      success: true,
      message: `${deletedCount}개의 객체가 삭제되었습니다`,
      deletedCount,
      fileCount: fileKeys.length,
      folderCount: folderPrefixes.length
    });
    
  } catch (err: unknown) {
    console.error('혼합 삭제 API 오류:', err);
    
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
      throw error(
        (err.status as number) || 500,
        (err.message as string) || '삭제 중 오류가 발생했습니다'
      );
    } else {
      throw error(500, '삭제 중 오류가 발생했습니다');
    }
  }
}
