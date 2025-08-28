import { createS3Client } from '$lib/server/s3_client';

export const load = async () => {
  try {
    // 기존 S3 클라이언트 재사용
    const s3Client = createS3Client();
    const bucketsListRaw = await s3Client.listBuckets().promise();
    
    // 버킷을 생성일자 순으로 정렬 (최신이 첫 번째)
    const bucketsList = bucketsListRaw.Buckets?.sort((a, b) => {
      const dateA = new Date(a.CreationDate || 0);
      const dateB = new Date(b.CreationDate || 0);
      return dateB.getTime() - dateA.getTime(); // 내림차순 정렬
    });
    
    return {
      buckets: bucketsList,
      connected: true
    };
  } catch (error) {
    console.error('MinIO 연결 오류:', error);
    return {
      buckets: [],
      connected: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
};
