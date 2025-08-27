import type AWS from 'aws-sdk';

/**
 * 객체 업로드를 위한 pre-signed URL 생성
 */
export async function getPresignedUploadUrl(
  s3Client: AWS.S3,
  bucketName: string,
  key: string,
  contentType: string,
  expiresIn: number = 60 // 기본 만료 시간: 60초
): Promise<string> {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      Expires: expiresIn
    };
    
    return s3Client.getSignedUrlPromise('putObject', params);
  } catch (error) {
    console.error(`Error creating presigned URL for upload: ${key} to bucket ${bucketName}:`, error);
    throw error;
  }
}

/**
 * 객체 다운로드를 위한 pre-signed URL 생성
 */
export async function getPresignedDownloadUrl(
  s3Client: AWS.S3,
  bucketName: string,
  key: string,
  expiresIn: number = 60 // 기본 만료 시간: 60초
): Promise<string> {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
      Expires: expiresIn
    };
    
    return s3Client.getSignedUrlPromise('getObject', params);
  } catch (error) {
    console.error(`Error creating presigned URL for download: ${key} from bucket ${bucketName}:`, error);
    throw error;
  }
}
