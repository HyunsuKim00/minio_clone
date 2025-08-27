<script lang="ts">
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import BrowserHeader from '$lib/components/layout/BrowserHeader.svelte';
  import { fileFilterStore } from '$lib/stores/filterStore';
  
  let { data, children } = $props();
  let sidebarOpen = $state(true);
  
  // 필터 변경 핸들러 (BrowserHeader에서 직접 스토어를 업데이트하므로 여기서는 생략 가능)
  // 하지만 하위 호환성을 위해 유지
  function handleFilterChange(filter: string) {
    // 이제 BrowserHeader에서 직접 스토어를 업데이트하므로 여기서는 중복 작업이 됨
    // fileFilterStore.set(filter);
  }
</script>

<div class="flex h-screen bg-white">
  <!-- 좌측 사이드바 -->
  <Sidebar 
    buckets={data.buckets || []} 
    activeBucket={''} 
    bind:isOpen={sidebarOpen} 
  />
  
  <!-- 메인 콘텐츠 영역 -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- 헤더 -->
    <BrowserHeader 
      onFilterChange={handleFilterChange}
    />
    
    <!-- 메인 콘텐츠 -->
    <main class="flex-[0.95] overflow-auto p-4">
      {@render children()}
    </main>
  </div>
</div>