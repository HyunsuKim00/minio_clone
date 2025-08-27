<script lang="ts">
  import { formatBytes } from '$lib/utils/formatters';
  
  export let bucketName: string = '';
  export let createdDate: string = '';
  export let totalSize: number = 0;
  export let objectCount: number = 0;
  export let onRefresh: () => void = () => {};
  export let onUpload: () => void = () => {};
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
          <!-- 새로고침 버튼 -->
          <button 
            on:click={onRefresh}
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            title="새로고침"
          >
            새로고침 
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <!-- 업로드 버튼 -->
          <button 
            on:click={onUpload}
            class="inline-flex items-center px-3 py-2 border border-blue-950 text-sm rounded-md text-white bg-blue-950 hover:bg-blue-800 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            title="파일 업로드"
          >
            업로드
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
</header>