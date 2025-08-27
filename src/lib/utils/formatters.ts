/**
 * 바이트 크기를 읽기 쉬운 형식으로 변환
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 날짜를 형식화
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

/**
 * 파일 확장자에 따른 아이콘/타입 반환
 */
export function getFileType(key: string): string {
  if (key.endsWith('/')) return '📁 폴더';
  
  const ext = key.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) return '🖼️ 이미지';
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) return '🎬 비디오';
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return '🎵 오디오';
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return '📄 문서';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜️ 압축파일';
  
  return '📄 파일';
}
