import { listObjects } from '$lib/server';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { createS3Client } from '$lib/server/s3_client';

export const load: LayoutServerLoad = async ({ params, parent }) => {
  const { bucketName } = params;
  
  if (!bucketName) {
    throw error(400, '버킷 이름이 필요합니다');
  }
  
  // 부모 레이아웃에서 버킷 목록 가져오기
  const layoutData = await parent();
  
  try {
    // 기존 S3 클라이언트 재사용
    const s3Client = createS3Client();
    const objects = await listObjects(s3Client, bucketName);
    
    // 객체 정렬: 폴더 먼저, 그 다음 파일을 이름순으로
    const sortedObjects = [...objects].sort((a, b) => {
      const aIsFolder = a.key.endsWith('/');
      const bIsFolder = b.key.endsWith('/');
      
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      
      return a.key.localeCompare(b.key);
    });
    
    // 버킷 생성일 (실제로는 S3 API에서 제공하지 않을 수 있음)
    const bucketInfo = layoutData.buckets?.find(bucket => bucket.Name === bucketName);
    const createdDate = bucketInfo?.CreationDate || new Date().toISOString();
    
    // 총 용량 계산
    const totalSize = objects.reduce((sum, obj) => sum + obj.size, 0);
    
    return {
      bucketName,
      createdDate,
      totalSize,
      objectCount: objects.length,
      objects: sortedObjects,
      buckets: layoutData.buckets,
      connected: layoutData.connected
    };
  } catch (err) {
    console.error(`버킷 ${bucketName}의 객체 목록 조회 중 오류:`, err);
    throw error(500, {
      message: err instanceof Error ? err.message : '객체 목록을 불러오는 중 오류가 발생했습니다'
    });
  }
};
