import AWS from 'aws-sdk';
import { S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION } from '$env/static/private';

// 환경 변수에서 직접 설정 가져오기
export function createS3Client(): AWS.S3 {
    // AWS SDK 설정
    AWS.config.update({
        httpOptions: {
            timeout: 5000 // 타임아웃 설정 (5초)
        }
    });

    return new AWS.S3({
        endpoint: S3_ENDPOINT,
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
        region: S3_REGION,
        s3ForcePathStyle: true, // MinIO에는 항상 true로 설정
        signatureVersion: 'v4',
        sslEnabled: false, // SSL 비활성화
        s3DisableBodySigning: true, // 본문 서명 비활성화
        computeChecksums: false // 체크섬 계산 비활성화
    });
}