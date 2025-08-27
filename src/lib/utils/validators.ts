/**
 * 버킷 이름 유효성 검사
 * S3 버킷 이름 규칙:
 * - 3~63자 사이
 * - 소문자, 숫자, 점, 하이픈만 포함
 * - IP 주소 형식이 아니어야 함
 * - 점으로 시작하거나 끝나지 않아야 함
 */
export function validateBucketName(name: string): { valid: boolean; message?: string } {
  if (!name) {
    return { valid: false, message: '버킷 이름을 입력해주세요.' };
  }
  
  if (name.length < 3 || name.length > 63) {
    return { valid: false, message: '버킷 이름은 3~63자 사이여야 합니다.' };
  }
  
  if (!/^[a-z0-9.-]+$/.test(name)) {
    return { valid: false, message: '버킷 이름은 소문자, 숫자, 점, 하이픈만 포함해야 합니다.' };
  }
  
  if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) {
    return { valid: false, message: '버킷 이름은 IP 주소 형식이 아니어야 합니다.' };
  }
  
  if (name.startsWith('.') || name.endsWith('.')) {
    return { valid: false, message: '버킷 이름은 점으로 시작하거나 끝나지 않아야 합니다.' };
  }
  
  return { valid: true };
}
