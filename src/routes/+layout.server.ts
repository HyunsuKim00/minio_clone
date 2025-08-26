import { createDefaultS3Client, listBuckets, listObjects } from '$lib/s3_sdk';
import type { ObjectInfo } from '$lib/s3_sdk/types';

export const load = async () => {
    try {
        const s3Client = createDefaultS3Client();
        
        // 버킷 목록 가져오기
        const bucketsList = await listBuckets(s3Client);
        
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