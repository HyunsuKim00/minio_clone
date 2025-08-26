import type { S3ClientConfig } from '$lib/s3_sdk/types';

// 환경 변수에서 설정 가져오기
export function getConfig(): S3ClientConfig {
  return {
    endpoint: 'http://127.0.0.1:9000', // 하드코딩된 URL
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    region: 'us-east-1',
    forcePathStyle: true
  };
}