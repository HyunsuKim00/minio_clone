import type AWS from 'aws-sdk';

/**
 * 서버사이드 전용: 객체 삭제 관련 함수들
 * 삭제는 보안상 서버에서만 처리
 */

// 단일 객체 삭제
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

// 다중 객체 삭제
export async function deleteObjects(s3Client: AWS.S3, bucketName: string, keys: string[]) {
  try {
    const params: AWS.S3.DeleteObjectsRequest = {
      Bucket: bucketName,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false
      }
    };
    
    const data = await s3Client.deleteObjects(params).promise();
    return data;
  } catch (error) {
    console.error(`Error deleting multiple objects from bucket ${bucketName}:`, error);
    throw error;
  }
}
