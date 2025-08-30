import { fail } from '@sveltejs/kit';
import { createS3Client } from '$lib/server/s3_client';
import type { Actions } from '@sveltejs/kit';

export const actions: Actions = {  
  deleteObject: async ({ request, params }) => {
    const { bucketName } = params;
    
    try {
        const formData = await request.formData();
        const keyValue = formData.get('key');
        
        if (!keyValue) {
            return fail(400, { success: false, message: '객체 키가 필요합니다' });
        }
        
        // S3 클라이언트 생성 및 객체 삭제
        const s3Client = createS3Client();
        await s3Client.deleteObject({
            Bucket: bucketName as string,  // 타입 단언으로 오류 해결
            Key: keyValue.toString()
        }).promise();
        
        return { success: true };
    } catch (err) {
        console.error('객체 삭제 중 오류:', err);
        return fail(500, { 
            success: false, 
            message: err instanceof Error ? err.message : '객체 삭제 중 오류가 발생했습니다' 
        });
    }
  }
}