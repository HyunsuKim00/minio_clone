// S3 클라이언트 설정 타입
export interface S3ClientConfig {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    region?: string;
    forcePathStyle?: boolean;
  }

export interface ObjectInfo {
    key: string;
    size: number;
    lastModified?: Date;
    etag?: string;
}