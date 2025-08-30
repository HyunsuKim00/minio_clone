<script lang="ts">
  import type { ObjectInfo } from '$lib/server/index';
  import { download } from '$lib/utils/download';
  import { invalidateAll } from '$app/navigation';
  import { formatBytes } from '$lib/utils/formatters';

  
  interface Props {
    object: ObjectInfo;
    bucketName: string;
    metadata?: any; // 서버에서 전달받은 메타데이터
    onClose: () => void;
  }
  
  let { object, bucketName, metadata, onClose }: Props = $props();
  
  let downloading = $state(false);
  let deleting = $state(false);
  
  // 날짜 포맷팅 함수
  function formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return '알 수 없음';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // 파일 확장자 추출
  function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  }
  
  // MIME 타입에 따른 아이콘 클래스
  function getFileIconClass(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'text-green-600';
      case 'pdf':
        return 'text-red-600';
      case 'doc':
      case 'docx':
        return 'text-blue-600';
      case 'txt':
      case 'md':
        return 'text-gray-600';
      case 'zip':
      case 'rar':
      case '7z':
        return 'text-purple-600';
      default:
        return 'text-gray-500';
    }
  }
  
  // 다운로드 처리
  async function handleDownload() {
    await download(bucketName, object.key);
  }

  // 삭제 처리
  async function handleDelete() {
    if (deleting) return;
    
    // 삭제 확인
    if (!confirm(`"${object.key}"를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      deleting = true;
      
      // 삭제 요청 - 부모 경로(browser/[bucketName]/+page.server.ts)의 deleteObject 액션 사용
      const formData = new FormData();
      formData.append('key', object.key);
      
      const response = await fetch(`/browser/${bucketName}/${object.key}?/deleteObject`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        // 에러 응답인 경우 JSON 파싱
        try {
          const errorResult = await response.json();
          throw new Error(errorResult.message || '객체 삭제 실패');
        } catch (jsonError) {
          throw new Error(`삭제 실패: ${response.statusText}`);
        }
      }
      
      // 모든 로드 함수 재실행으로 최신 데이터 가져오기
      await invalidateAll();
      
      // 삭제 후 이전 페이지로 이동
      onClose();
      
    } catch (err) {
      console.error('삭제 중 오류:', err);
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      deleting = false;
    }
  }
</script>

<!-- 우측 사이드바 (레이아웃 내부) -->
<div class="h-full bg-white flex flex-col">
  <!-- 헤더 -->
  <div class="flex items-center justify-between p-4 border-b border-gray-200">
    <h2 class="text-lg font-semibold text-gray-900">파일 정보</h2>
    <button
      onclick={onClose}
      class="p-2 hover:bg-gray-100 rounded-md transition-colors"
      aria-label="사이드바 닫기"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
  
  <!-- 콘텐츠 -->
  <div class="p-4 overflow-y-auto flex-1 text-sm">
    <!-- 파일 아이콘 및 이름 -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <svg class="w-8 h-8 {getFileIconClass(object.key)} flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
        </svg>
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-medium text-gray-900 break-all">{object.key.split('/').pop()}</h3>
          <p class="text-xs text-gray-500 mt-1">{getFileExtension(object.key)} 파일</p>
        </div>
      </div>
    </div>

    <!-- Actions 섹션 -->
    <div class="mb-6">
      <h3 class="text-lg font-bold text-gray-900 mb-2">Actions</h3>
      <div class="border border-gray-300 rounded-md">
        <!-- 다운로드 -->
        <button 
          onclick={handleDownload}
          disabled={downloading}
          class="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors border-b border-gray-300">
          {#if downloading}
            다운로드 중...
          {:else}
            다운로드
          {/if}
        </button>
        
        <!-- 삭제 -->
        <button 
          onclick={handleDelete}
          disabled={deleting}
          class="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">
          {#if deleting}
            삭제 중...
          {:else}
            삭제
          {/if}
        </button>
      </div>
    </div>

    <!-- Object Info 섹션 -->
    <div class="mb-6">
      <h3 class="text-lg font-bold text-gray-900 mb-2">Object Info</h3>
      <div class="border-b border-gray-300 mb-3"></div>
      
      <div class="space-y-3 text-sm">
        <div>
          <div class="text-gray-600 mb-1 text-sm font-bold">Name:</div>
          <div class="text-gray-900 break-all text-sm">{object.key.split('/').pop()}</div>
        </div>
        
        <div>
          <div class="text-gray-600 mb-1 text-sm font-bold">Size:</div>
          <div class="text-gray-900 text-sm">{formatBytes(object.size)}</div>
        </div>
        
        <div>
          <div class="text-gray-600 mb-1 text-sm font-bold">Last Modified:</div>
          <div class="text-gray-900 text-sm">{formatDate(object.lastModified)}</div>
        </div>
        
        {#if object.etag}
          <div>
            <div class="text-gray-600 mb-1 text-sm font-bold">ETAG:</div>
            <div class="text-gray-900 font-mono break-all text-sm">{object.etag.replace(/"/g, '')}</div>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Metadata 섹션 -->
    {#if metadata}
      <div class="mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-2">Metadata</h3>
        <div class="border-b border-gray-300 mb-3"></div>
        
        <div class="space-y-3 text-sm">
          <div>
            <div class="text-gray-600 mb-1 text-sm font-bold">Content-Type:</div>
            <div class="text-gray-900 text-sm">{metadata.ContentType || 'unknown'}</div>
          </div>
          
          {#if metadata.ContentEncoding}
            <div>
              <div class="text-gray-600 mb-1 text-sm font-bold">Content-Encoding:</div>
              <div class="text-gray-900 text-sm">{metadata.ContentEncoding}</div>
            </div>
          {/if}
          
          {#if metadata.CacheControl}
            <div>
              <div class="text-gray-600 mb-1 text-sm font-bold">Cache-Control:</div>
              <div class="text-gray-900 text-sm">{metadata.CacheControl}</div>
            </div>
          {/if}
          
          {#if metadata.Expires}
            <div>
              <div class="text-gray-600 mb-1 text-sm font-bold">Expires:</div>
              <div class="text-gray-900 text-sm">{formatDate(metadata.Expires)}</div>
            </div>
          {/if}
          
          {#if metadata.StorageClass}
            <div>
              <div class="text-gray-600 mb-1 text-sm font-bold">Storage-Class:</div>
              <div class="text-gray-900 text-sm">{metadata.StorageClass}</div>
            </div>
          {/if}
          
          <!-- 사용자 정의 메타데이터 -->
          {#if metadata.Metadata && Object.keys(metadata.Metadata).length > 0}
            {#each Object.entries(metadata.Metadata) as [key, value]}
              <div>
                <div class="text-blue-600 mb-1 text-sm font-bold">{key}:</div>
                <div class="text-gray-900 text-sm">{value}</div>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>