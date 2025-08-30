<script lang="ts">
  import { fileFilter } from '$lib/stores/filterStore.svelte';
  
  let { onFilterChange = () => {} } = $props();
  
  // 필터 값이 변경되면 전역 상태에 저장하고 콜백도 호출
  function handleFilterChange(e: Event) {
    const target = e.target as HTMLInputElement;
    fileFilter.set(target.value);
    onFilterChange(target.value);
  }
</script>

<header class="bg-white border-b border-gray-200">
  <div class="px-4 py-5 sm:px-6 lg:px-8">
    <div class="grid grid-cols-3 items-center">
      <!-- 왼쪽: 타이틀 -->
      <div class="col-span-1">
        <h1 class="text-xl font-bold text-gray-900 flex items-center">
          Object Browser
        </h1>
      </div>
      
      <!-- 가운데: 파일 필터링 인풋 -->
      <div class="col-span-1 flex justify-center">
        <div class="relative w-full max-w-md">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="버킷 내 오브젝트 검색..." 
            bind:value={fileFilter.value}
            oninput={handleFilterChange}
            class="pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
          />
        </div>
      </div>
    </div>
  </div>
</header>