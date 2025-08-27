<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/ui/Button.svelte';
  import { browser } from '$app/environment';
  import { invalidateAll } from '$app/navigation';
  
  export let buckets: any[] = [];
  export let activeBucket: string = '';
  export let isOpen: boolean = true;
  
  // 버킷 필터링
  let filterValue = '';
  $: filteredBuckets = buckets.filter(bucket => 
    bucket.Name.toLowerCase().includes(filterValue.toLowerCase())
  );
  
  // 모달 상태 관리
  let showModal = false;
  let newBucketName = '';
  let isSubmitting = false;
  let errorMessage = '';
  
  // 모달 열기/닫기
  function openModal() {
    showModal = true;
    errorMessage = '';
    isSubmitting = false;
    setTimeout(() => {
      document.getElementById('modal-bucket-input')?.focus();
    }, 100);
  }
  
  function closeModal() {
    showModal = false;
    newBucketName = '';
    errorMessage = '';
    isSubmitting = false;
  }
  
  // input 값 클리어
  function clearInput() {
    newBucketName = '';
    document.getElementById('modal-bucket-input')?.focus();
  }
  
  // 사이드바 토글
  function toggleSidebar() {
    isOpen = !isOpen;
  }
  
  // 모달 외부 클릭시 닫기
  function handleModalClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }
  
  // ESC 키로 모달 닫기
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && showModal) {
      closeModal();
    }
  }
</script>

<div class="sidebar-container h-full bg-gray-100 border-r border-gray-200 transition-all duration-300 flex flex-col"
     class:w-64={isOpen} 
     class:w-16={!isOpen}>
  
  <!-- 사이드바 헤더 -->
  <div class="sidebar-header flex items-center justify-between p-4 border-b border-gray-200">
    {#if isOpen}
      <h2 class="text-lg font-semibold text-gray-800">버킷 목록</h2>
    {/if}
    
    <button 
      on:click={toggleSidebar} 
      class="p-1 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
      aria-label={isOpen ? '사이드바 닫기' : '사이드바 열기'}
    >
      {#if isOpen}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      {/if}
    </button>
  </div>
  
  <!-- 사이드바 내용 -->
  <div class="sidebar-content flex-1 overflow-y-auto p-4">
    {#if isOpen}
      <!-- 버킷 생성 버튼 -->
      <div class="mb-4">
        <Button 
          variant="primary" 
          fullWidth={true} 
          onClick={openModal}
        >
          + 버킷 생성
        </Button>
      </div>
      
      <!-- 버킷 필터 -->
      <div class="mb-4">
        <input 
          type="text" 
          placeholder="버킷 검색..." 
          bind:value={filterValue}
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      
      <!-- 버킷 목록 -->
      <div class="mt-6">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">버킷</h3>
        {#if filteredBuckets.length > 0}
          <ul class="space-y-1">
            {#each filteredBuckets as bucket}
              <li>
                <a 
                  href="/browser/{bucket.Name}" 
                  class="flex items-center px-3 py-2 text-sm rounded-md transition-colors"
                  class:bg-primary-100={bucket.Name === activeBucket}
                  class:text-primary-800={bucket.Name === activeBucket}
                  class:hover:bg-gray-200={bucket.Name !== activeBucket}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span class="truncate">{bucket.Name}</span>
                </a>
              </li>
            {/each}
          </ul>
        {:else}
          <div class="text-center py-4 text-gray-500 text-sm">
            {filterValue ? '검색 결과가 없습니다' : '버킷이 없습니다'}
          </div>
        {/if}
      </div>
    {:else}
      <!-- 축소된 사이드바 내용 -->
      <div class="flex flex-col items-center pt-4 space-y-4">
        <button 
          on:click={openModal} 
          class="p-2 rounded-md hover:bg-gray-200 text-gray-700 transition-colors"
          aria-label="버킷 생성"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        
        {#if filteredBuckets.length > 0}
          <div class="w-full">
            {#each filteredBuckets as bucket}
              <a 
                href="/browser/{bucket.Name}" 
                class="flex justify-center py-2 mb-1 rounded-md transition-colors"
                class:bg-primary-100={bucket.Name === activeBucket}
                class:text-primary-800={bucket.Name === activeBucket}
                class:hover:bg-gray-200={bucket.Name !== activeBucket}
                title={bucket.Name}
                aria-label={`${bucket.Name} 버킷 열기`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- 사이드바 푸터 -->
  <div class="sidebar-footer border-t border-gray-200 p-4">
    {#if isOpen}
      <div class="space-y-2">
        <a href="/docs" class="flex items-center text-sm text-gray-600 hover:text-gray-900 py-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Documentation
        </a>
        <a href="/license" class="flex items-center text-sm text-gray-600 hover:text-gray-900 py-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          License
        </a>
        <form method="POST" action="?/signOut">
          <button type="submit" class="flex w-full items-center text-sm text-red-600 hover:text-red-800 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </form>
      </div>
    {:else}
      <div class="flex flex-col items-center space-y-4">
        <a href="/docs" class="p-2 rounded-md hover:bg-gray-200 text-gray-600 transition-colors" title="Documentation" aria-label="문서 보기">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </a>
        <form method="POST" action="?/signOut">
          <button type="submit" class="p-2 rounded-md hover:bg-gray-200 text-red-600 transition-colors" title="Sign Out" aria-label="로그아웃">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </form>
      </div>
    {/if}
  </div>
</div>

<!-- 버킷 생성 모달 -->
{#if showModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    on:click={handleModalClick}
  >
    <div class="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full mx-4">
      <!-- 모달 헤더 -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">새 버킷 생성</h3>
        <button 
          on:click={closeModal}
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="모달 닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- 모달 폼 -->
      <form 
        method="POST" 
        action="/browser?/createBucket" 
        use:enhance={({ formData, cancel }) => {
          isSubmitting = true;
          errorMessage = '';
          
          return async ({ result }) => {
            isSubmitting = false;
            
            if (result.type === 'failure') {
              errorMessage = (result.data as any)?.message || '버킷 생성 중 오류가 발생했습니다.';
            } else if (result.type === 'redirect') {
              // 모든 서버사이드 데이터 무효화 (새로고침 효과)
              await invalidateAll();
              closeModal();
            }
          };
        }}
        class="space-y-4"
      >
        <div>
          <label for="modal-bucket-input" class="block text-sm font-medium text-gray-700 mb-1">
            버킷 이름
          </label>
          <div class="relative">
            <input 
              type="text" 
              id="modal-bucket-input"
              name="bucketName" 
              bind:value={newBucketName} 
              placeholder="버킷 이름을 입력하세요" 
              class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            {#if newBucketName}
              <button 
                type="button"
                on:click={clearInput}
                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="입력값 지우기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            {/if}
          </div>
          <p class="mt-1 text-xs text-gray-500">
            소문자, 숫자, 점, 하이픈만 사용 가능합니다 (3-63자)
          </p>
        </div>
        
        <!-- 에러 메시지 -->
        {#if errorMessage}
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {errorMessage}
          </div>
        {/if}
        
        <!-- 모달 버튼 -->
        <div class="flex gap-3 pt-2">
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth={true}
            disabled={!newBucketName.trim() || isSubmitting}
          >
            {#if isSubmitting}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              생성 중...
            {:else}
              생성하기
            {/if}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={closeModal}
            disabled={isSubmitting}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- 키보드 이벤트 핸들러 -->
<svelte:window on:keydown={handleKeydown} />