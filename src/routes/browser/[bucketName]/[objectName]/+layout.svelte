<script lang="ts">
  import { goto } from '$app/navigation';
  import RightSidebar from '$lib/components/object/rightSidebar.svelte';
  
  let { data, children } = $props();
  
  // 사이드바 닫기 함수
  function handleCloseSidebar() {
    // 현재 파일이 속한 폴더로 돌아가기
    const returnUrl = data.currentPrefix 
      ? `/browser/${data.bucketName}?prefix=${encodeURIComponent(data.currentPrefix)}`
      : `/browser/${data.bucketName}`;
    goto(returnUrl);
  }
</script>

<!-- 메인 레이아웃: 좌측 콘텐츠 + 우측 Sidebar -->
<div class="flex-1 flex h-full">
  <!-- 좌측: 페이지 콘텐츠 -->
  <div class="flex-1">
    {@render children()}
  </div>
  
  <!-- 우측: 사이드바 -->
  <div class="w-96 border-l border-gray-200">
    <RightSidebar 
      object={data.selectedObject}
      bucketName={data.bucketName}
      metadata={data.metadata}
      onClose={handleCloseSidebar}
    />
  </div>
</div>