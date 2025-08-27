import type AWS from 'aws-sdk';

/**
 * 레거시 함수들 - 현재 사용되지 않음
 * 
 * 현재 프로젝트에서는 pre-signed URL 방식을 사용하므로
 * 서버 경유 업로드/다운로드는 사용하지 않습니다.
 * 
 * 필요시에만 사용하세요. (성능상 pre-signed URL 방식이 더 효율적)
 */

// ⚠️ 사용되지 않음: 서버 경유 객체 업로드 (pre-signed URL 방식 권장)
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

// ⚠️ 사용되지 않음: 서버 경유 객체 다운로드 (pre-signed URL 방식 권장)
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
