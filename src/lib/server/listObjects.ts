import type AWS from 'aws-sdk';
import type { ObjectInfo, FolderInfo, DirectoryItem } from './types';

// 폴더와 파일을 구분하여 조회
// 전체 버킷 내 목록을 보여줄 때 사용
// 특정 폴더 내 목록을 보여줄 때도 사용
export async function listDirectory(s3Client: AWS.S3, bucketName: string, prefix: string = ''): Promise<DirectoryItem> {
  try {
    // Delimiter를 추가하여 폴더/파일 구분
    const data = await s3Client.listObjectsV2({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: '/'  // 핵심: 폴더 구조 인식
    }).promise();
    
    // 폴더 정보 처리 (CommonPrefixes)
    const folders: FolderInfo[] = (data.CommonPrefixes || []).map(commonPrefix => {
      const folderPrefix = commonPrefix.Prefix || '';
      const folderName = folderPrefix.replace(prefix, '').replace('/', '');
      
      return {
        prefix: folderPrefix,
        name: folderName,
        type: 'folder' as const
      };
    });
    
    // 파일 정보 처리 (Contents)
    const files: ObjectInfo[] = (data.Contents || [])
      .filter(item => {
        // 현재 폴더의 직접적인 파일만 (하위 폴더 파일 제외)
        const key = item.Key || '';
        const relativePath = key.replace(prefix, '');
        return relativePath && !relativePath.includes('/');
      })
      .map(item => ({
        key: item.Key || '',
        size: item.Size || 0,
        lastModified: item.LastModified,
        etag: item.ETag
      }));
    
    // 경로별 breadcrumb 생성
    const breadcrumbs = generateBreadcrumbs(prefix);
    
    // 폴더와 파일을 합쳐서 정렬 (폴더 먼저, 그 다음 파일)
    const items: (ObjectInfo | FolderInfo)[] = [
      ...folders.sort((a, b) => a.name.localeCompare(b.name)),
      ...files.sort((a, b) => a.key.localeCompare(b.key))
    ];
    
    return {
      items,
      currentPrefix: prefix,
      breadcrumbs
    };
    
  } catch (error) {
    // NoSuchBucket 에러는 정상적인 상황 (버킷이 삭제되었거나 존재하지 않음)
    // 불필요한 에러 로그를 남기지 않고 에러를 그대로 던짐
    if (error instanceof Error && 
        (error.message.includes('NoSuchBucket') || 
         error.message.includes('does not exist') ||
         (error as any).code === 'NoSuchBucket')) {
      throw error;
    }
    
    // 실제 예상치 못한 에러만 로깅
    console.error(`Error listing directory in bucket ${bucketName}:`, error);
    throw error;
  }
}

// Breadcrumb 경로 생성 유틸리티
function generateBreadcrumbs(prefix: string): { name: string; prefix: string }[] {
  const breadcrumbs: { name: string; prefix: string }[] = [
    { name: '홈', prefix: '' }
  ];
  
  if (!prefix) return breadcrumbs;
  
  const parts = prefix.split('/').filter(part => part.length > 0);
  let currentPrefix = '';
  
  for (const part of parts) {
    currentPrefix += part + '/';
    breadcrumbs.push({
      name: part,
      prefix: currentPrefix
    });
  }
  
  return breadcrumbs;
}