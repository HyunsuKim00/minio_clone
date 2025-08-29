import { createS3Client } from '$lib/server/s3_client';
import type { ObjectInfo } from '$lib/server/index';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
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
        }) || [];

        // 객체 목록은 각 페이지에서 필요할 때 개별적으로 가져오도록 변경
        let objectsList: ObjectInfo[] = [];
        
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