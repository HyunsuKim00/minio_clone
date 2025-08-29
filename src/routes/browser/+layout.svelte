<script lang="ts">
  import Sidebar from '$lib/components/browser/leftSidebar.svelte';
  import BrowserHeader from '$lib/components/browser/BrowserHeader.svelte';
  
  let { data, children } = $props();
  let sidebarOpen = $state(true);
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
    <!-- 헤더 (onFilterChange prop 제거) -->
    <BrowserHeader />
    
    <!-- 메인 콘텐츠 -->
    <main class="flex-[0.95] overflow-auto px-6 py-10">
      {@render children()}
    </main>
  </div>
</div>