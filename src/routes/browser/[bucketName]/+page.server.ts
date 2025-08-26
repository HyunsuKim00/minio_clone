import { createDefaultS3Client, listObjects } from '$lib/s3_sdk';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export const load = async ({ params, parent }: { params: { bucketName: string }, parent: () => Promise<any> }) => {
    const { bucketName } = params;
    
    if (!bucketName) {
        throw error(400, '버킷 이름이 필요합니다');
    }
    
    // 부모 레이아웃에서 버킷 목록 가져오기
    const layoutData = await parent();
    
    try {
        const s3Client = createDefaultS3Client();
        const objects = await listObjects(s3Client, bucketName);
        
        // 객체 정렬: 폴더 먼저, 그 다음 파일을 이름순으로
        const sortedObjects = [...objects].sort((a, b) => {
            const aIsFolder = a.key.endsWith('/');
            const bIsFolder = b.key.endsWith('/');
            
            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            
            return a.key.localeCompare(b.key);
        });
        
        return {
            bucketName,
            objects: sortedObjects,
            timestamp: new Date().toISOString(),
            buckets: layoutData.buckets // 부모 레이아웃에서 가져온 버킷 목록 전달
        };
    } catch (err) {
        console.error(`버킷 ${bucketName}의 객체 목록 조회 중 오류:`, err);
        throw error(500, {
            message: err instanceof Error ? err.message : '객체 목록을 불러오는 중 오류가 발생했습니다'
        });
    }
};