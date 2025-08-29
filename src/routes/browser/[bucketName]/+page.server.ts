// src/routes/browser/[bucketName]/+page.server.ts
import { error, fail } from '@sveltejs/kit';
import type { Actions } from '@sveltejs/kit';
import { createS3Client } from '$lib/server';

export const load = async ({ params, parent }: { params: { bucketName: string }, parent: () => Promise<any> }) => {
    const { bucketName } = params;
    
    if (!bucketName) {
        throw error(400, '버킷 이름이 필요합니다');
    }
    
    try {
        // 부모 레이아웃에서 이미 로드된 데이터 가져오기
        const layoutData = await parent();
        
        // 필요한 데이터만 반환 (objects는 이미 layoutData에 있음)
        return {
            bucketName,
            timestamp: new Date().toISOString(),
            buckets: layoutData.buckets
        };
    } catch (err) {
        console.error(`버킷 ${bucketName} 데이터 처리 중 오류:`, err);
        throw error(500, {
            message: err instanceof Error ? err.message : '데이터를 처리하는 중 오류가 발생했습니다'
        });
    }
};

// 서버 액션 정의 (개별 객체 삭제 액션)
export const actions: Actions = {  
    // 새로 추가: 일괄 삭제 액션
    bulkDeleteObjects: async ({ request, params }) => {
        const { bucketName } = params;
        
        try {
            const formData = await request.formData();
            const objectKeysStr = formData.get('objectKeys');
            
            if (!objectKeysStr) {
                return fail(400, { success: false, message: '삭제할 객체 키가 필요합니다' });
            }
            
            const objectKeys: string[] = JSON.parse(objectKeysStr.toString());
            
            if (objectKeys.length === 0) {
                return fail(400, { success: false, message: '삭제할 객체가 없습니다' });
            }
            
            // S3 클라이언트 생성 및 객체들 삭제
            const s3Client = createS3Client();
            
            // 각 객체를 개별적으로 삭제 (기존 버킷 삭제에서와 동일한 방식)
            for (const key of objectKeys) {
                await s3Client.deleteObject({
                    Bucket: bucketName as string,
                    Key: key
                }).promise();
            }
            
            return { 
                success: true, 
                message: `${objectKeys.length}개의 객체가 삭제되었습니다` 
            };
        } catch (err) {
            console.error('일괄 삭제 중 오류:', err);
            return fail(500, { 
                success: false, 
                message: err instanceof Error ? err.message : '일괄 삭제 중 오류가 발생했습니다' 
            });
        }
    }
};