import type AWS from 'aws-sdk';

// 버킷 목록 조회
export async function listBuckets(s3Client: AWS.S3) {
  try {
    const data = await s3Client.listBuckets().promise();
    return data.Buckets || [];
  } catch (error) {
    console.error('Error listing buckets:', error);
    throw error;
  }
}

// 버킷 생성
export async function createBucket(s3Client: AWS.S3, bucketName: string, region?: string) {
  try {
    await s3Client.createBucket({
      Bucket: bucketName,
      CreateBucketConfiguration: region ? { LocationConstraint: region } : undefined
    }).promise();
    return true;
  } catch (error) {
    console.error(`Error creating bucket ${bucketName}:`, error);
    throw error;
  }
}

// 버킷 삭제
export async function deleteBucket(s3Client: AWS.S3, bucketName: string) {
  try {
    await s3Client.deleteBucket({ Bucket: bucketName }).promise();
    return true;
  } catch (error) {
    console.error(`Error deleting bucket ${bucketName}:`, error);
    throw error;
  }
}