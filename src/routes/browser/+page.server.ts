import { createS3Client } from '$lib/server/s3_client';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

// /browser 경로로 직접 접근 시 첫 번째 버킷으로 리디렉션
export const load = async ({ parent }: { parent: () => Promise<any> }) => {
  try {
    // parent(): 이미 로드된 상위 데이터를 비동기적으로 가져오는 함수
    // 부모 레이아웃에서 버킷 목록 가져오기
    const layoutData = await parent();
    
    // 버킷이 있으면 첫 번째 버킷으로 리디렉션
    if (layoutData.buckets && layoutData.buckets.length > 0) {
      const firstBucket = layoutData.buckets[0];
      throw redirect(307, `/browser/${firstBucket.Name}`);
    }
    
    // 버킷이 없거나 첫 번째 버킷이 존재하지 않으면 현재 페이지 유지 (버킷 생성 화면)
    return {};
  } catch (error) {
    // 리디렉션 에러는 정상적인 처리이므로 다시 throw
    if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
      throw error;
    }
    console.error('버킷 리스트 로딩 중 오류:', error);
    return {};
  }
};

export const actions: Actions = {
  // 버킷 삭제 액션
  // request: 폼 데이터를 담고 있는 HTTP request 객체. 클라이언트에서 서버로 전송된 객체
  deleteBucket: async ({ request }) => {
    const formData = await request.formData();
    const bucketName = formData.get('bucketName')?.toString();
    
    if (!bucketName) {
      return fail(400, { 
        error: true, 
        message: '버킷 이름이 필요합니다.'
      });
    }
    
    try {
      // S3 클라이언트 생성하하기
      const s3Client = createS3Client();
      
      // 1. 버킷의 모든 객체 조회
      const listObjectsResponse = await s3Client.listObjectsV2({ Bucket: bucketName }).promise();
      const objects = listObjectsResponse.Contents || [];
      
      // 2. 모든 객체 개별적으로 삭제 (객체가 하나라도 존재하는 경우)
      if (objects.length > 0) {
        for (const object of objects) {
          // 오브젝트는 Key 값으로 삭제 요청
          if (object.Key) {
            await s3Client.deleteObject({
              Bucket: bucketName,
              Key: object.Key
            }).promise();
          }
        }
      }
      
      // 3. 버킷 삭제 (모든 객체 삭제 이후)
      // 버킷은 Bucket 이름으로 삭제 요청
      await s3Client.deleteBucket({ Bucket: bucketName }).promise();
      
      console.log(`버킷 '${bucketName}' 삭제 완료`);
      
      // 리디렉션 대신 성공 응답 반환 (클라이언트에서 리디렉션 처리)
      return {
        success: true,
        message: `버킷 '${bucketName}' 삭제 완료`
      };
      
    } catch (error) {
      // 리디렉션 에러는 정상적인 처리이므로 다시 throw
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
        throw error;
      }
      
      console.error('버킷 삭제 중 오류:', error);
      
      return fail(500, { 
        error: true, 
        message: '버킷 삭제 중 오류가 발생했습니다.'
      });
    }
  },
  
  // 버킷 생성 액션
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
      
      // 리디렉션 대신 성공 응답 반환 (클라이언트에서 리디렉션 처리)
      return {
        success: true,
        bucketName,
        message: `버킷 '${bucketName}' 생성 완료`
      };
      
    } catch (error) {
      // 리디렉션 에러는 정상적인 처리이므로 다시 throw
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
        throw error;
      }
      console.error('버킷 생성 중 오류:', error);
      
      // AWS 오류 메시지 처리
      if (error instanceof Error) {
        // 디버깅을 위해 전체 오류 메시지 출력
        console.log('Error object:', {
          message: error.message,
          code: (error as any).code,
          name: error.name
        });
        
        // 이미 존재하는 버킷 처리
        if (error.message.includes('BucketAlreadyOwnedByYou') || 
            (error as any).code === 'BucketAlreadyOwnedByYou') {
          return fail(400, { 
            error: true, 
            message: '이미 존재하는 버킷 이름입니다.',
            bucketName
          });
        }
        
        // 유효하지 않은 버킷 이름 처리
        if (error.message.includes('InvalidBucketName') || 
            (error as any).code === 'InvalidBucketName') {
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