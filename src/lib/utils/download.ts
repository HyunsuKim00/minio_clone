import { getPresignedUrl } from './presignedUrl';

export async function download(bucketName: string, key: string) {
    try {
        const url = await getPresignedUrl({
        operation: 'download',
        bucketName: bucketName,
        key: key,
        expiresIn: 300
    });
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`${key} 다운로드 실패: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // 브라우저에서만 실행 (SSR 방지)
    if (typeof window !== 'undefined') {
        const blobUrl = window.URL.createObjectURL(blob);
        
        // 파일 이름 추출
        const fileName = key.split('/').pop() || key;
        
        // 다운로드 링크 생성
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 메모리 정리
        window.URL.revokeObjectURL(blobUrl);
    }
  } catch (err) {
    console.error('다운로드 중 오류:', err);
    alert(err instanceof Error ? err.message : '다운로드 중 오류가 발생했습니다.');
  }
}