/**
 * Pre-signed URL 관련 유틸리티 함수들
 */

export interface PresignedUrlOptions {
  operation: 'upload' | 'download';
  bucketName: string;
  key: string;
  contentType?: string; // 업로드 시에만 필요
  expiresIn?: number; // 기본값: 300초 (5분)
}

export interface PresignedUrlResponse {
  success: boolean;
  url: string;
  operation: string;
  bucketName: string;
  key: string;
  expiresIn: number;
}

/**
 * 서버에서 pre-signed URL을 요청하는 공통 함수
 */
export async function getPresignedUrl(options: PresignedUrlOptions): Promise<string> {
  const {
    operation,
    bucketName,
    key,
    contentType,
    expiresIn = 300
  } = options;

  try {
    const requestBody: any = {
      operation,
      bucketName,
      key,
      expiresIn
    };

    // 업로드 작업인 경우에만 contentType 추가
    if (operation === 'upload' && contentType) {
      requestBody.contentType = contentType;
    }

    const response = await fetch('/api/presigned', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Pre-signed URL을 가져오는데 실패했습니다.');
    }

    const data: PresignedUrlResponse = await response.json();
    return data.url;

  } catch (error) {
    console.error(`Pre-signed URL 요청 중 오류 (${operation}):`, error);
    throw error;
  }
}

/**
 * 파일 업로드용 pre-signed URL 요청
 */
export async function getUploadUrl(
  bucketName: string,
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  return getPresignedUrl({
    operation: 'upload',
    bucketName,
    key,
    contentType,
    expiresIn
  });
}

/**
 * 파일 다운로드용 pre-signed URL 요청
 */
export async function getDownloadUrl(
  bucketName: string,
  key: string,
  expiresIn = 300
): Promise<string> {
  return getPresignedUrl({
    operation: 'download',
    bucketName,
    key,
    expiresIn
  });
}
