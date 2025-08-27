import type AWS from 'aws-sdk';
import type { ObjectInfo } from '$lib/s3_sdk/types';

/**
 * 서버사이드 전용: 객체 목록 조회 및 메타데이터 관련 함수들
 */

// 객체 목록 조회
export async function listObjects(s3Client: AWS.S3, bucketName: string, prefix?: string): Promise<ObjectInfo[]> {
  try {
    const params: AWS.S3.ListObjectsV2Request = {
      Bucket: bucketName,
      Prefix: prefix || ''
    };
    
    const data = await s3Client.listObjectsV2(params).promise();
    
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

// 객체 메타데이터 조회
export async function getObjectMetadata(s3Client: AWS.S3, bucketName: string, key: string) {
  try {
    const params: AWS.S3.HeadObjectRequest = {
      Bucket: bucketName,
      Key: key
    };
    
    const data = await s3Client.headObject(params).promise();
    return data;
  } catch (error) {
    console.error(`Error getting object metadata ${key} from bucket ${bucketName}:`, error);
    throw error;
  }
}
