<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  
  // Svelte 5 Runes 사용
  interface Props {
    buckets?: any[];
    activeBucket?: string;
    isOpen?: boolean;
  }
  
  let { buckets = [], activeBucket = '', isOpen = $bindable(true) }: Props = $props();

  // 버킷 필터링 - $state와 $derived 사용
  let filterValue = $state('');
  let filteredBuckets = $derived(
    buckets.filter(bucket => 
      bucket.Name.toLowerCase().includes(filterValue.toLowerCase())
    )
  );
  
  // 모달 상태 관리 - $state 사용
  let showModal = $state(false);
  let showDeleteModal = $state(false);
  let newBucketName = $state('');
  let currentBucketName = $state('');
  let isSubmitting = $state(false);
  let errorMessage = $state('');
  
  // 버킷 삭제 모달 열기
  function openDeleteModal(bucketName: string) {
    currentBucketName = bucketName;
    showDeleteModal = true;
    errorMessage = '';
    isSubmitting = false;}
  
  // 모달 열기/닫기
  function openModal() {
    showModal = true;
    errorMessage = '';
    isSubmitting = false;
    setTimeout(() => {
      document.getElementById('modal-bucket-input')?.focus();
    }, 100);}
  
  function closeModal() {
    showModal = false;
    showDeleteModal = false;
    newBucketName = '';
    currentBucketName = '';
    errorMessage = '';
    isSubmitting = false;
  }
  
  // 사이드바 확장하기 (검색이나 버킷 목록 보기 위해)
  function expandSidebar() {
    isOpen = true;
  }
  
  // 검색을 위해 사이드바 확장 (검색창에 포커스)
  function expandForSearch() {
    isOpen = true;
    setTimeout(() => {
      const searchInput = document.querySelector('.sidebar-content input[type="text"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 300); // 사이드바 애니메이션 완료 후
  }
  
  // input 값 클리어
  function clearInput() {
    newBucketName = '';
    document.getElementById('modal-bucket-input')?.focus();}
  
  // 사이드바 토글
  function toggleSidebar() {
    isOpen = !isOpen;}
  
  // 모달 외부 클릭시 닫기
  function handleModalClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }
  
  // ESC 키로 모달 닫기
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && (showModal || showDeleteModal)) {
      closeModal();
    }
  }
</script>

<div class="sidebar-container h-full bg-gray-100 border-r border-gray-200 transition-all duration-300 flex flex-col"
     class:w-64={isOpen} 
     class:w-16={!isOpen}>
  
  <!-- 사이드바 헤더 -->
  <div class="sidebar-header flex items-center justify-between px-4 py-6 border-b border-gray-300">
    {#if isOpen}
      <h2 class="text-xl font-bold text-gray-900">버킷 목록</h2>
    {/if}
    
    <button 
      onclick={toggleSidebar} 
      class="p-1 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
      aria-label={isOpen ? '사이드바 닫기' : '사이드바 열기'}>
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
      <!-- 1. 버킷 생성 버튼 (95-104줄) -->
      <div class="mb-4">
        <button 
          type="button"
          onclick={openModal}
          class="w-full px-4 py-2 text-left bg-blue-950 text-white text-sm font-medium rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span class="text-sm">버킷 생성</span>
        </button>
      </div>
      
      <!-- 버킷 필터 -->
      <div class="mb-4">
        <input 
          type="text" 
          placeholder="버킷 검색..." 
          bind:value={filterValue}
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"/>
      </div>
      
      <!-- 버킷 목록 -->
      <div class="mt-6">
        <h3 class="text font-semibold text-gray-500 uppercase tracking-wider mb-3">버킷</h3>
        {#if filteredBuckets.length > 0}
          <ul class="border-t border-gray-300 space-y-1">
            {#each filteredBuckets as bucket}
              <li>
                <div class="flex items-center justify-between">
                  <a 
                    href="/browser/{bucket.Name}" 
                    class="flex items-center flex-grow px-3 py-2 text rounded-md transition-colors"
                    class:bg-primary-100={bucket.Name === activeBucket}
                    class:text-primary-800={bucket.Name === activeBucket}
                    class:hover:bg-gray-200={bucket.Name !== activeBucket}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span class="truncate">{bucket.Name}</span>
                  </a>
                  
                  <!-- 삭제 버튼 -->
                  <button
                    onclick={() => openDeleteModal(bucket.Name)}
                    class="p-1 rounded-md hover:bg-gray-200 text-red-500 transition-colors"
                    aria-label="버킷 삭제"
                    title="버킷 삭제">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
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
          onclick={openModal} 
          class="p-2 rounded-md hover:bg-gray-200 text-gray-700 transition-colors"
          aria-label="버킷 생성">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        
        <!-- 검색 아이콘 (클릭 시 사이드바 확장 + 검색창 포커스) -->
        <button 
          onclick={expandForSearch} 
          class="p-2 rounded-md hover:bg-gray-200 text-gray-700 transition-colors"
          aria-label="검색창 열기">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        
        {#if filteredBuckets.length > 0}
          <div class="w-full">
            {#each filteredBuckets as bucket}
              <button
                onclick={() => {
                  expandSidebar();
                  // 사이드바 확장 후 잠시 후에 페이지 이동
                  setTimeout(() => {
                    window.location.href = `/browser/${bucket.Name}`;
                  }, 150);
                }}
                class="flex justify-center py-2 mb-1 rounded-md transition-colors w-full"
                class:bg-primary-100={bucket.Name === activeBucket}
                class:text-primary-800={bucket.Name === activeBucket}
                class:hover:bg-gray-200={bucket.Name !== activeBucket}
                title={bucket.Name}
                aria-label={`${bucket.Name} 버킷 열기`}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- 버킷 생성 모달 -->
{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    role="button"
    tabindex="-1"
    onclick={handleModalClick}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleModalClick(e as any);
      }
    }}>
    <div class="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full mx-4">
      <!-- 모달 헤더 -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">새 버킷 생성</h3>
        <button 
          onclick={closeModal}
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="모달 닫기">
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
              // 디버깅용 로그 추가
              console.log('Failure result:', result.data);
              errorMessage = (result.data as any)?.message || '버킷 생성 중 오류가 발생했습니다.';
            } else if (result.type === 'success') {
              // 성공 응답에서 버킷 이름을 가져와 해당 버킷으로 리디렉션
              const bucketName = (result.data as any)?.bucketName;
              if (bucketName) {
                // 모달 닫기
                closeModal();
                // 생성된 버킷으로 직접 이동
                window.location.href = `/browser/${bucketName}`;
              } else {
                // 버킷 이름이 없는 경우 데이터만 무효화하고 모달 닫기
                await invalidateAll();
                closeModal();
              }
            } else if (result.type === 'redirect') {
              // 기존 리디렉션 처리도 유지 (다른 액션에서 사용될 수 있음)
              window.location.href = result.location;
            }
          };
        }}
        class="space-y-4">
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
              required/>
            {#if newBucketName}
              <button 
                type="button"
                onclick={clearInput}
                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="입력값 지우기">
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
          <!-- 2. 모달의 생성하기 버튼 (310-325줄) -->
          <button 
            type="submit"
            disabled={!newBucketName.trim() || isSubmitting}
            class="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {#if isSubmitting}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              생성 중...
            {:else}
              생성하기
            {/if}
          </button>

          <!-- 3. 모달의 취소 버튼 (326-333줄) -->
          <button 
            type="button" 
            onclick={closeModal}
            disabled={isSubmitting}
            class="w-full px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            취소
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- 버킷 삭제 모달 -->
{#if showDeleteModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    role="button"
    tabindex="-1"
    onclick={handleModalClick}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleModalClick(e as any);
      }
    }}>
    <div class="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full mx-4">
      <!-- 모달 헤더 -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">버킷 삭제</h3>
        <button 
          onclick={closeModal}
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="모달 닫기">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- 모달 내용 -->
      <div class="space-y-4">
        <div class="text-center p-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <h4 class="text-lg font-medium text-gray-900 mt-2">정말 삭제하시겠습니까?</h4>
          <p class="text-sm text-gray-600 mt-1">
            버킷 "{currentBucketName}"을(를) 삭제하면 모든 파일이 영구적으로 삭제됩니다.
            이 작업은 되돌릴 수 없습니다.
          </p>
        </div>
        
        <!-- 에러 메시지 -->
        {#if errorMessage}
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {errorMessage}
          </div>
        {/if}
        
        <!-- 모달 폼 -->
         <!-- 브라우저 서버 코드의 deleteBucket 액션을 사용하여 버킷 삭제 -->
        <form 
          method="POST" 
          action="/browser?/deleteBucket" 
          use:enhance={({ formData }) => {
            isSubmitting = true;
            errorMessage = '';
            
            formData.append('bucketName', currentBucketName);
            
            return async ({ result }) => {
              isSubmitting = false;
              
              if (result.type === 'failure') {
                errorMessage = (result.data as any)?.message || '버킷 삭제 중 오류가 발생했습니다.';
              } else if (result.type === 'success') {
                // 성공 응답 처리
                closeModal();
                // 브라우저 페이지로 이동
                window.location.href = '/browser';
              } else if (result.type === 'redirect') {
                // 기존 리디렉션 처리도 유지
                window.location.href = result.location;
              }
            };
          }}
          class="flex gap-3 pt-2">
          <button 
            type="submit"
            disabled={isSubmitting}
            class="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {#if isSubmitting}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              삭제 중...
            {:else}
              삭제하기
            {/if}
          </button>

          <button 
            type="button" 
            onclick={closeModal}
            disabled={isSubmitting}
            class="w-full px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            취소
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- 키보드 이벤트 핸들러 -->
<svelte:window on:keydown={handleKeydown} />