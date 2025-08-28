<script lang="ts">
  import { writable } from 'svelte/store';
  
  let { onFilterChange = () => {} } = $props();
  let filterValue = $state('');
  
  // 필터 값이 변경되면 스토어에 직접 저장하고 콜백도 호출
  function handleFilterChange(e: Event) {
    const target = e.target as HTMLInputElement;
    filterValue = target.value;
    
    const fileFilterStore = writable('');
    fileFilterStore.set(filterValue);
    
    onFilterChange(filterValue);
  }
</script>

<header class="bg-white border-b border-gray-200">
  <div class="px-4 py-4 sm:px-6 lg:px-8">
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
            placeholder="파일 검색..." 
            bind:value={filterValue}
            oninput={handleFilterChange}
            class="pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
          />
        </div>
      </div>
      
      <!-- 오른쪽: 도움말 버튼 -->
      <div class="col-span-1 flex justify-end items-center">
        <button class="h-10 w-10 rounded border hover:bg-gray-100 flex items-center justify-center" title="도움말" aria-label="도움말">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</header>