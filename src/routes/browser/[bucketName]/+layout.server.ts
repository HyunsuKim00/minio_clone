import { listDirectory } from '$lib/server';
import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { createS3Client } from '$lib/server/s3_client';

export const load: LayoutServerLoad = async ({ params, parent, url }) => {
  const { bucketName } = params;
  
  if (!bucketName) {
    throw error(400, '버킷 이름이 필요합니다');
  }
  
  // URL 파라미터에서 prefix 가져오기 (폴더 경로)
  const prefix = url.searchParams.get('prefix') || '';
  
  // 부모 레이아웃에서 버킷 목록 가져오기
  const layoutData = await parent();
  
  try {
    // 새로운 listDirectory 함수 사용 (폴더/파일 구분)
    const s3Client = createS3Client();
    const directoryData = await listDirectory(s3Client, bucketName, prefix);
    
    // 버킷 생성일 (실제로는 S3 API에서 제공하지 않을 수 있음)
    const bucketInfo = layoutData.buckets?.find(bucket => bucket.Name === bucketName);
    const createdDate = bucketInfo?.CreationDate || new Date().toISOString();
    
    // 총 용량 계산 (파일만)
    const files = directoryData.items.filter(item => 'size' in item);
    const totalSize = files.reduce((sum, file) => sum + ('size' in file ? file.size : 0), 0);
    
    return {
      bucketName,
      createdDate,
      totalSize,
      objectCount: directoryData.items.length,
      // 기존 호환성을 위해 objects 유지 (파일만)
      objects: files,
      // 새로운 폴더 구조 데이터
      directory: directoryData,
      buckets: layoutData.buckets,
      connected: layoutData.connected,
      currentPrefix: prefix
    };
  } catch (err) {
    console.error(`버킷 ${bucketName}의 디렉토리 조회 중 오류:`, err);
    
    // 버킷이 존재하지 않으면 browser 페이지로 리디렉션
    if (err instanceof Error && (err.message.includes('NoSuchBucket') || err.message.includes('does not exist'))) {
      throw redirect(303, '/browser');
    }
    
    throw error(500, {
      message: err instanceof Error ? err.message : '디렉토리 목록을 불러오는 중 오류가 발생했습니다'
    });
  }
};
