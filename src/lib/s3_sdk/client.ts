import AWS from 'aws-sdk';
import type { S3ClientConfig } from '$lib/s3_sdk/types';
import {getConfig} from '$lib/s3_sdk/config';

// 사용자 설정으로 S3 클라이언트 생성
export function createDefaultS3Client(): AWS.S3 {
    return createS3Client(getConfig());
}

// S3 클라이언트 생성 함수
export function createS3Client(config: S3ClientConfig): AWS.S3 {
    // AWS SDK 설정
    AWS.config.update({
        httpOptions: {
            timeout: 5000 // 타임아웃 설정 (5초)
        }
    });
    
    return new AWS.S3({
        endpoint: config.endpoint,
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
        region: config.region || 'us-east-1',
        s3ForcePathStyle: true, // MinIO에는 항상 true로 설정
        signatureVersion: 'v4',
        sslEnabled: false, // SSL 비활성화
        s3DisableBodySigning: true, // 본문 서명 비활성화
        computeChecksums: false // 체크섬 계산 비활성화
    });
}