/**
 * 바이트 크기를 읽기 쉬운 형식으로 변환
 */
// 버켓 헤더와 오브젝트 리스트에서 모두 사용하여 함수로 분리

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}