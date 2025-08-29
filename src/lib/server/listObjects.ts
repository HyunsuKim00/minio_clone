import type AWS from 'aws-sdk';
import type { ObjectInfo, FolderInfo, DirectoryItem } from './types';

// 기존 함수 (하위 호환성 유지)
export async function listObjects(s3Client: AWS.S3, bucketName: string, prefix?: string): Promise<ObjectInfo[]> {
  try {  
    const data = await s3Client.listObjectsV2(
      {
        Bucket: bucketName,
        Prefix: prefix || ''
      }
    ).promise();
    
    return (data.Contents || []).map(item => ({
      key: item.Key || '',
      size: item.Size || 0,
      lastModified: item.LastModified,
      etag: item.ETag
    }));
  } catch (error) {
    console.error(`Error listing objects in bucket ${bucketName}:`, error);
    throw error;
  }
}

// 새로운 함수: 폴더와 파일을 구분하여 조회
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