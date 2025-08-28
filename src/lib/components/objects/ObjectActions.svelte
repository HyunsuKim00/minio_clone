<!-- 오브젝트 액션 버튼 컴포넌트 -->
<script lang="ts">
  import type { ObjectInfo } from '$lib/server/index';
  import { getPresignedUrl } from '$lib/utils/presignedUrl';

  export let object: ObjectInfo;
  export let bucketName: string;
  
  let downloading = false;
  let error = '';
  
  // pre-signed URL을 사용한 파일 다운로드 (공통 유틸리티 활용)
  async function downloadObject(event: Event) {
    // 이벤트 전파 방지 (테이블 행 클릭 이벤트와 충돌 방지)
    event.preventDefault();
    event.stopPropagation();
    
    if (downloading) return;
    
    try {
      downloading = true;
      error = '';

      // 1. 서버에게 pre-signed URL 요청
      const url = await getPresignedUrl(
        {
          operation: 'download',
          bucketName,
          key: object.key,
          expiresIn: 300}
        );
      
      // 2. fetch를 사용해 파일을 받아온 후 blob으로 다운로드 (favicon 에러 방지)
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`다운로드 실패: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // 파일 이름 추출 (경로에서 마지막 부분)
      const fileName = object.key.split('/').pop() || object.key;
      
      // 다운로드 링크 생성 및 클릭
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 메모리 정리를 위해 blob URL 해제
      window.URL.revokeObjectURL(blobUrl);
      
    } catch (err) {
      console.error('파일 다운로드 중 오류:', err);
      error = err instanceof Error ? err.message : '파일 다운로드 중 오류가 발생했습니다.';
    } finally {
      downloading = false;
    }
  }
  
  // 파일 삭제 기능 - SvelteKit 서버 액션 사용
  async function deleteObject(event: Event) {
    // 이벤트 전파 방지 (테이블 행 클릭 이벤트와 충돌 방지)
    event.preventDefault();
    event.stopPropagation();
    
    try {
      error = '';
      
      // FormData 생성 및 객체 키 추가
      const formData = new FormData();
      formData.append('key', object.key);
      
      // SvelteKit의 서버 액션 호출 (현재 URL + ?/deleteObject)
      const response = await fetch(`?/deleteObject`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!result.success && result.error) {
        throw new Error(result.message || '객체 삭제 실패');
      }
      
      console.log(`객체 ${object.key} 삭제 완료`);
      // 삭제 후 페이지 새로고침
      window.location.reload();
    } catch (err) {
      console.error('객체 삭제 중 오류:', err);
      error = err instanceof Error ? err.message : '객체 삭제 중 오류가 발생했습니다.';
    }
  }
</script>

<div class="flex space-x-2">
  <!-- 다운로드 버튼 -->
  <button 
    on:click={downloadObject} 
    disabled={downloading}
    title="다운로드"
    aria-label="파일 다운로드"
    class="inline-flex items-center px-2 py-1 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {#if downloading}
      <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    {/if}
  </button>
  
  <!-- 삭제 버튼 -->
  <button 
    on:click={deleteObject}
    title="삭제"
    aria-label="파일 삭제"
    class="inline-flex items-center px-2 py-1 border border-red-300 text-sm rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  </button>
  
  {#if error}
    <div class="text-sm text-red-500">{error}</div>
  {/if}
</div>
