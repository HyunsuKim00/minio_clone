import { error, redirect } from '@sveltejs/kit';
import { createS3Client } from '$lib/server/s3_client';
import { listDirectory } from '$lib/server/listObjects';
import type { ObjectInfo } from '$lib/server/types';

// 파일 상세 페이지 로드
// 파일이 선택되었을 때, 파일이 속한 버킷 리스트에 해당 파일이 존재하는지 확인
// 존재하면 그 파일 경로로 이동하고 상세 데이터를 보여줌.
// 존재하지 않으면 버킷 경로로 이동
export const load = async ({ params }: { params: { bucketName: string; objectName: string } }) => {
  const { bucketName, objectName } = params;
  
  if (!bucketName || !objectName) {
    throw error(400, '버킷 이름과 오브젝트 이름이 필요합니다');
  }
  
  // URL 디코딩 (한글 파일명 지원)
  const decodedObjectName = decodeURIComponent(objectName);
  
  // 파일 경로에서 현재 파일이 속한 폴더의 prefix 계산
  // 예: "folder/subfolder/file.txt" → "folder/subfolder/"
  const lastSlashIndex = decodedObjectName.lastIndexOf('/');
  const currentPrefix = lastSlashIndex >= 0 ? decodedObjectName.substring(0, lastSlashIndex + 1) : '';
  
  // S3 클라이언트 생성
  const s3Client = createS3Client();
  
  // 현재 prefix의 directory 정보 로드 (폴더 구조 유지를 위해)
  const directoryData = await listDirectory(s3Client, bucketName, currentPrefix);
  
  // 요청된 오브젝트가 실제로 존재하는지 확인 (파일만)
  const selectedObject = directoryData.items.find(item => 
    'key' in item && item.key === decodedObjectName
  ) as ObjectInfo | undefined;
  
  // 요청된 오브젝트가 실제로 존재하는지 확인
  // 존재하면 그 폴더로 이동
  // 존재하지 않으면 버킷 루트로 리디렉션
  if (!selectedObject) {
    const redirectUrl = currentPrefix 
      ? `/browser/${bucketName}?prefix=${encodeURIComponent(currentPrefix)}`
      : `/browser/${bucketName}`;
    throw redirect(303, redirectUrl);
  }
  
  // 선택된 객체의 상세 메타데이터 가져오기
  let metadata = null;
  try {
    metadata = await s3Client.headObject({
      Bucket: bucketName,
      Key: decodedObjectName
    }).promise();
    
  } catch (metaError) {
    console.warn('⚠️ 메타데이터 조회 실패 (선택적 기능이므로 계속 진행):', metaError);
    // 메타데이터 조회 실패는 페이지 로드를 막지 않음
  }
  
  // 총 파일 크기 계산 (파일들만)
  const fileItems = directoryData.items.filter(item => 'key' in item);
  const totalSize = fileItems.reduce((sum, item) => sum + (item.size || 0), 0);
  
  return {
    selectedObject,
    bucketName,
    objectName: decodedObjectName,
    // 폴더 구조가 유지된 directory 데이터 전달
    directory: directoryData,
    currentPrefix,
    totalSize,
    objectCount: fileItems.length,
    metadata // Raw 메타데이터 전달
  };
};
