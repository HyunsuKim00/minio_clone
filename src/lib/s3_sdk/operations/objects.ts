import type AWS from 'aws-sdk';
import type { ObjectInfo } from '$lib/s3_sdk/types';

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

// 객체 업로드
export async function uploadObject(
  s3Client: AWS.S3, 
  bucketName: string, 
  key: string, 
  body: AWS.S3.Body, 
  contentType?: string
) {
  try {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType
    };
    
    const data = await s3Client.putObject(params).promise();
    return data;
  } catch (error) {
    console.error(`Error uploading object ${key} to bucket ${bucketName}:`, error);
    throw error;
  }
}

// 객체 다운로드
export async function getObject(s3Client: AWS.S3, bucketName: string, key: string) {
  try {
    const params: AWS.S3.GetObjectRequest = {
      Bucket: bucketName,
      Key: key
    };
    
    const data = await s3Client.getObject(params).promise();
    return data;
  } catch (error) {
    console.error(`Error downloading object ${key} from bucket ${bucketName}:`, error);
    throw error;
  }
}

// 객체 삭제
export async function deleteObject(s3Client: AWS.S3, bucketName: string, key: string) {
  try {
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: bucketName,
      Key: key
    };
    
    await s3Client.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error(`Error deleting object ${key} from bucket ${bucketName}:`, error);
    throw error;
  }
}