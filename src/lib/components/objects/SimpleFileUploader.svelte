<!-- 간단한 파일 업로드 컴포넌트 -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getUploadUrl } from '$lib/utils/presignedUrl';
  
  export let bucketName: string;
  export let onUploadComplete: () => void = () => {};
  
  let fileInput: HTMLInputElement;
  let uploading = false;
  
  // 파일 선택 시 자동 업로드
  async function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    
    if (!files || files.length === 0) return;
    
    try {
      uploading = true;
      
      // 모든 파일 업로드 진행
      const uploadPromises = Array.from(files).map(file => uploadFile(file));
      
      // 모든 업로드가 완료될 때까지 대기
      await Promise.all(uploadPromises);
      
      // 업로드 완료 후 처리
      onUploadComplete();
      
      // 파일 입력 초기화
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (err) {
      console.error('파일 업로드 중 오류:', err);
      alert(err instanceof Error ? err.message : '파일 업로드 중 오류가 발생했습니다.');
    } finally {
      uploading = false;
    }
  }
  
  // 단일 파일 업로드 처리
  /*
  Promise<void>는 아무것도 반환하지 않는 함수
  파일을 업로드하는 행위만 하면 될 뿐, 무언가를 반환할 필요는 없음.
  파일 업로드 행위에 대한 응답을 response함수에 담고, 그 response함수를 분석했을 때 에러가 있으면 사용자에게 에러만 던짐.
  참고로 무언가를 반환하는 함수에는 Promise<Response>를 사용함.
  */
  async function uploadFile(file: File): Promise<void> {
    // 파일 경로 및 이름 설정
    const key = `${Date.now()}-${file.name}`;
    
    try {
      // 1. 서버에게 pre-signed URL 요청 (공통 유틸리티 사용)
      const url = await getUploadUrl(bucketName, key, file.type, 300);
      
      // 2. pre-signed URL을 사용하여 직접 MinIO에 업로드
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });
      
      if (!response.ok) {
        throw new Error(`업로드 실패: ${response.statusText}`);
      }
      
    } catch (err) {
      console.error(`파일 '${file.name}' 업로드 중 오류:`, err);
      throw err;
    }
  }
  
  // 버튼 클릭 시 파일 선택 창 열기
  function openFileSelector() {
    if (fileInput) {
      fileInput.click();
    }
  }
  
  // 컴포넌트 외부에서 파일 선택 창을 열 수 있는 메서드 노출
  export function triggerFileSelect() {
    openFileSelector();
  }
</script>

<!-- 숨겨진 파일 입력 -->
<input 
  type="file" 
  class="hidden"
  multiple 
  bind:this={fileInput}
  on:change={handleFileSelect}
/>
