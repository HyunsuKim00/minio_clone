<script lang="ts">
  import BucketHeader from '$lib/components/layout/BucketHeader.svelte';
  import SimpleFileUploader from '$lib/components/objects/SimpleFileUploader.svelte';
  import { onMount } from 'svelte';
  
  let { data, children } = $props();
  let fileUploader: SimpleFileUploader;
  
  // 헤더 이벤트 핸들러
  function handleRefresh() {
    window.location.reload();
  }
  
  function handleUpload() {
    // 파일 선택 창 직접 열기
    if (fileUploader) {
      fileUploader.triggerFileSelect();
    }
  }
  
  // 파일 업로드 완료 후 처리
  function handleUploadComplete() {
    window.location.reload();
  }
  
  // 데이터 형식 변환
  const createdDateStr = typeof data.createdDate === 'string' ? data.createdDate : 
                         data.createdDate instanceof Date ? data.createdDate.toISOString() : '';
</script>

<div class="flex flex-col h-full bg-white border border-gray-200 m-4">
  <!-- 버킷 헤더 -->
  <BucketHeader 
    bucketName={data.bucketName || ''} 
    createdDate={createdDateStr} 
    totalSize={data.totalSize || 0} 
    objectCount={data.objectCount || 0}
    onRefresh={handleRefresh}
    onUpload={handleUpload}
  />
  
  <!-- 숨겨진 파일 업로더 -->
  <SimpleFileUploader 
    bind:this={fileUploader} 
    bucketName={data.bucketName || ''} 
    onUploadComplete={handleUploadComplete} 
  />
  
  <!-- 메인 콘텐츠 -->
  <div class="flex-1 overflow-auto">
    {@render children()}
  </div>
</div>