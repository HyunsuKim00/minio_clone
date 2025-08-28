import { createS3Client } from '$lib/server/s3_client';
import { listObjects } from '$lib/server/index';
import type { ObjectInfo } from '$lib/server/index';

export const load = async () => {
    try {
        // S3 클라이언트 초기화 (앱 전체에서 재사용 가능)
        const s3Client = createS3Client();

        // 버킷 목록 가져오기
        const bucketsListRaw = await s3Client.listBuckets().promise();
        
        // 버킷을 생성일자 순으로 정렬 (최신이 첫 번째)
        const bucketsList = bucketsListRaw.Buckets?.sort((a, b) => {
            const dateA = new Date(a.CreationDate || 0);
            const dateB = new Date(b.CreationDate || 0);
            return dateB.getTime() - dateA.getTime(); // 내림차순 정렬
        });
        
        // 객체 목록 초기화
        let objectsList: ObjectInfo[] = [];
        
        // 버킷이 있으면 첫 번째 버킷의 객체 목록 가져오기
        if (bucketsList && bucketsList.length > 0) {
            try {
                const firstBucketName = bucketsList[0].Name || '';
                if (firstBucketName) {
                    objectsList = await listObjects(s3Client, firstBucketName);
                }
            } catch (objError) {
                console.error('객체 목록 가져오기 오류:', objError);
                // 오류가 발생해도 빈 배열 유지
            }
        }
        
        return {
            buckets: bucketsList,
            objects: objectsList,
            connected: true
        };
        
    } catch (error) {
        console.error('MinIO 연결 오류:', error);
        return {
            buckets: [],
            objects: [],
            connected: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류'
        };
    }
};