import type AWS from 'aws-sdk';
import type { ObjectInfo } from './types';

// 버킷 내 객체 목록을 조회하는 함수
// 루트 레이아웃 : 첫 버킷의 리스트를 가져올 때 사용
// 버킷 페이지 : 특정 버킷의 객체 목록을 가져올 때 사용
// 상위 레이아웃에서 가져온 데이터를 하위 레이아웃에서 완전히 재사용하기 어렵기 때문에 함수로 분리함.
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