<script lang="ts">
  import { formatBytes } from '$lib/utils/formatters';
  
  // Svelte 5 Runes 사용
  interface Props {
    bucketName?: string;
    createdDate?: string;
    totalSize?: number;
    objectCount?: number;
    onRefresh?: () => void;
    onUpload?: () => void;
    selectedObjects?: string[];
    onBulkDownload?: () => void;
    onBulkDelete?: () => void;
    onUploadFolder?: () => void;
  }
  
  let { 
    bucketName = '',
    createdDate = '',
    totalSize = 0,
    objectCount = 0,
    onRefresh = () => {},
    onUpload = () => {},
    selectedObjects = [],
    onBulkDownload = () => {},
    onBulkDelete = () => {},
    onUploadFolder = () => {}
  }: Props = $props();
  
  // 업로드 드롭다운 상태 - $state 사용
  let showUploadDropdown = $state(false);
  let dropdownRef = $state<HTMLDivElement | null>(null);
  
  // 외부 클릭 및 키보드 이벤트 처리 - $effect 사용
  $effect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
        showUploadDropdown = false;
      }
    }
    
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && showUploadDropdown) {
        showUploadDropdown = false;
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<header class="bg-white border-b border-gray-200">
  <div class="px-4 py-4 sm:px-6 lg:px-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div class="mb-3 sm:mb-0">
        <!-- 버킷 페이지 헤더 -->
        <div class="flex items-center">
          <h1 class="text-xl font-bold text-gray-900 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {bucketName}
          </h1>
        </div>
        <div class="mt-1 flex flex-wrap items-center text-sm text-gray-500">
          {#if createdDate}
            <span class="mr-4">생성일: {new Date(createdDate).toLocaleDateString()}</span>
          {/if}
          <span class="mr-4">총 용량: {formatBytes(totalSize)}</span>
          <span>오브젝트 수: {objectCount}</span>
        </div>
      </div>
      
      <!-- 버킷 페이지 액션 버튼 -->
      <div class="flex space-x-3">
        <!-- 일괄 작업 버튼들 (선택된 객체가 있을 때만 표시) -->
        {#if selectedObjects.length > 0}
          <!-- 일괄 다운로드 버튼 -->
          <button 
            onclick={onBulkDownload}
            class="inline-flex items-center px-3 py-2 border border-green-600 text-sm rounded-md text-green-700 bg-white hover:bg-green-50 hover:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
            title="선택된 파일들 다운로드"
          >
            일괄 다운로드
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          
          <!-- 일괄 삭제 버튼 -->
          <button 
            onclick={onBulkDelete}
            class="inline-flex items-center px-3 py-2 border border-red-600 text-sm rounded-md text-red-700 bg-white hover:bg-red-50 hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
            title="선택된 파일들 삭제"
          >
            일괄 삭제
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        {/if}
        
        <!-- 새로고침 버튼 -->
          <button 
            onclick={onRefresh}
            class="inline-flex items-center px-3 py-2 border border-gray-500 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            title="새로고침"
          >
            새로고침 
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <!-- 업로드 드롭다운 버튼 -->
          <div class="relative" bind:this={dropdownRef}>
            <button 
              onclick={() => showUploadDropdown = !showUploadDropdown}
              class="inline-flex items-center px-3 py-2 border border-blue-950 text-sm rounded-md text-white bg-blue-950 hover:bg-blue-800 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              title="업로드 옵션"
            >
              업로드
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
            
            <!-- 드롭다운 메뉴 -->
            {#if showUploadDropdown}
              <div class="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div class="py-1">
                  <button 
                    onclick={() => {
                      onUpload();
                      showUploadDropdown = false;
                    }}
                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    파일 업로드
                  </button>
                  <button 
                    onclick={() => {
                      onUploadFolder();
                      showUploadDropdown = false;
                    }}
                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    폴더 업로드
                  </button>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
</header>