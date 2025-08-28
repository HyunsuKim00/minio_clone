import { createS3Client } from '$lib/server/s3_client';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

// /browser 경로로 직접 접근 시 첫 번째 버킷으로 리디렉션
export const load = async ({ parent }: { parent: () => Promise<any> }) => {
  // 부모 레이아웃에서 버킷 목록 가져오기
  const layoutData = await parent();
  
  // 버킷이 있으면 첫 번째 버킷으로 리디렉션
  if (layoutData.buckets && layoutData.buckets.length > 0) {
    const firstBucket = layoutData.buckets[0];
    throw redirect(307, `/browser/${firstBucket.Name}`);
  }
  
  // 버킷이 없으면 현재 페이지 유지 (버킷 생성 화면)
  return {};
};

export const actions: Actions = {
  createBucket: async ({ request }) => {
    const formData = await request.formData();
    const bucketName = formData.get('bucketName')?.toString();
    
    if (!bucketName) {
      return fail(400, { 
        error: true, 
        message: '버킷 이름이 필요합니다',
        bucketName: ''
      });
    }
    
    // 버킷 이름 유효성 검사
    // 버킷 이름은 소문자, 숫자, 점, 하이픈만 포함해야 함 (3-63자)
    const validBucketNameRegex = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
    if (!validBucketNameRegex.test(bucketName)) {
      return fail(400, { 
        error: true, 
        message: '유효하지 않은 버킷 이름입니다. 소문자, 숫자, 점, 하이픈만 사용 가능합니다 (3-63자).',
        bucketName
      });
    }
    
    try {
      // S3 클라이언트 가져오기
      const s3Client = createS3Client();
      
      // 버킷 생성
      await s3Client.createBucket({Bucket: bucketName}).promise();

      console.log(`버킷 '${bucketName}' 생성 완료`);
      
      // 루트 페이지로 리디렉션 (자동으로 첫 번째 버킷으로 이동)
      throw redirect(303, '/');
      
    } catch (error) {
      // 리디렉션 에러는 정상적인 처리이므로 다시 throw
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
        throw error;
      }
      console.error('버킷 생성 중 오류:', error);
      
      // AWS 오류 메시지 처리
      if (error instanceof Error) {
        if (error.message.includes('BucketAlreadyExists')) {
          return fail(400, { 
            error: true, 
            message: '이미 존재하는 버킷 이름입니다.',
            bucketName
          });
        }
        if (error.message.includes('InvalidBucketName')) {
          return fail(400, { 
            error: true, 
            message: '유효하지 않은 버킷 이름입니다.',
            bucketName
          });
        }
      }
      
      return fail(500, { 
        error: true, 
        message: '버킷 생성 중 오류가 발생했습니다.',
        bucketName
      });
    }
  }
};