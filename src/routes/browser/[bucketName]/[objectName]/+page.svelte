<script lang="ts">
  import ObjectList from '$lib/components/bucket/ObjectList.svelte';
  import { fileFilter } from '$lib/stores/filterStore.svelte';
  
  let { data } = $props();
  
  // 필터 값에 따라 객체 목록 필터링 (폴더 + 파일 모두 검색)
  let filteredItems = $derived(() => {
    const items = data.directory?.items || [];
    if (!fileFilter.value) return items;
    
    const searchTerm = fileFilter.value.toLowerCase().trim();
    
    return items.filter(item => {
      if ('type' in item && item.type === 'folder') {
        // 폴더인 경우: name 속성 검색
        return item.name.toLowerCase().includes(searchTerm);
      } else if ('key' in item) {
        // 파일인 경우: key (전체 경로) 검색
        const fileName = item.key.split('/').pop() || item.key; // 파일명만 추출
        return fileName.toLowerCase().includes(searchTerm) || 
               item.key.toLowerCase().includes(searchTerm); // 전체 경로도 검색
      }
      return false;
    });
  });
  
  // 선택 변경을 부모(레이아웃)에게 전달
  function handleSelectionChange(selectedObjects: string[]) {
      // 부모에게 커스텀 이벤트 발송 (브라우저에서만)
      if (typeof document !== 'undefined') {
          const event = new CustomEvent('selectionChange', {
              detail: selectedObjects,
              bubbles: true
          });
          document.dispatchEvent(event);
      }
  }
</script>

<!-- 객체 목록 페이지 -->
<div class="p-5 overflow-auto h-full">
    <!-- 경로 바와 폴더 생성 버튼 (분리된 박스들) -->
    <div class="flex items-center gap-3 mb-4">
        <!-- 경로 박스 -->
        <div class="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div class="flex items-center space-x-2 text-sm">
                <svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <div class="flex items-center space-x-1 min-w-0">
                    <button 
                        class="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        onclick={() => window.location.href = `/browser/${data.bucketName}`}
                    >
                        {data.bucketName}
                    </button>
                    {#if data.directory?.breadcrumbs && data.directory.breadcrumbs.length > 1}
                        {#each data.directory.breadcrumbs.slice(1) as breadcrumb}
                            <span class="text-gray-400">/</span>
                            <button 
                                class="text-blue-600 hover:text-blue-800 font-medium hover:underline truncate"
                                onclick={() => window.location.href = `/browser/${data.bucketName}?prefix=${encodeURIComponent(breadcrumb.prefix)}`}
                            >
                                {breadcrumb.name}
                            </button>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
        
        <!-- 폴더 생성 버튼 (독립적) -->
        <button 
            onclick={() => {
                // 현재 prefix로 새 폴더 생성 페이지로 이동
                const createUrl = data.currentPrefix 
                  ? `/browser/${data.bucketName}?prefix=${encodeURIComponent(data.currentPrefix)}`
                  : `/browser/${data.bucketName}`;
                window.location.href = createUrl;
            }}
            class="inline-flex items-center h-11 px-3 py-2 border border-gray-600 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200 flex-shrink-0"
            title="새 폴더 생성"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            폴더 생성
        </button>
    </div>
    
    {#if fileFilter.value && filteredItems().length === 0}
      <div class="p-5 mt-20 bg-white rounded text-gray-600 text-center">검색 결과가 없습니다.</div>
    {:else}
      <ObjectList 
        directory={{ items: filteredItems(), currentPrefix: data.currentPrefix || '', breadcrumbs: data.directory?.breadcrumbs || [] }}
        currentPrefix={data.currentPrefix || ''}
        bucketName={data.bucketName}
        onSelectionChange={handleSelectionChange}
      />
    {/if}
</div>
