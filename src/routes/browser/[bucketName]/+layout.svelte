<script lang="ts">
  import BucketHeader from '$lib/components/layout/BucketHeader.svelte';
  import { getPresignedUrl } from '$lib/utils/presignedUrl';
  
  // SvelteKit 런타임 속성
  let { data, children } = $props();
  
  // 파일 업로드 관련 상태
  let fileInput: HTMLInputElement | null = null;
  let uploading = false;
  
  // 데이터 형식 변환
  const createdDateStr = typeof data.createdDate === 'string' ? data.createdDate : 
                         data.createdDate instanceof Date ? data.createdDate.toISOString() : '';
  
  // 이벤트 핸들러 함수들
  function handleRefresh() {
    window.location.reload();
  }
  
  function handleUpload() {
    // 파일 선택 창 직접 열기
    if (fileInput) {
      fileInput.click();
    }
  }
  
  async function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    
    if (!files || files.length === 0) return;
    
    try {
      uploading = true;
      
      // 모든 파일 업로드 진행
      const uploadPromises = Array.from(files).map(async (file) => {
        // 파일 경로 및 이름 설정
        const key = `${Date.now()}-${file.name}`;
        
        // 1. 서버에게 pre-signed URL 요청
        const url = await getPresignedUrl(
          {
            operation: 'upload',
            bucketName: data.bucketName,
            key,
            contentType: file.type,
            expiresIn: 300}
          );
        
        // 2. pre-signed URL을 사용하여 직접 MinIO에 업로드
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type
          },
          body: file
        });
        
        if (!response.ok) {
          throw new Error(`업로드 실패: ${response.statusText}`);
        }
      });
      
      // 모든 업로드가 완료될 때까지 대기
      await Promise.all(uploadPromises);
      
      // 파일 입력 초기화
      if (fileInput) {
        fileInput.value = '';
      }
      
      // 업로드 완료 후 페이지 새로고침
      window.location.reload();
      
    } catch (err) {
      console.error('파일 업로드 중 오류:', err);
      alert(err instanceof Error ? err.message : '파일 업로드 중 오류가 발생했습니다.');
    } finally {
      uploading = false;
    }
  }
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
  
  <!-- 숨겨진 파일 입력 -->
  <input 
    type="file" 
    class="hidden"
    multiple 
    bind:this={fileInput}
    onchange={handleFileSelect}
  />
  
  <!-- 메인 콘텐츠 -->
  <div class="flex-1 overflow-auto">
    {@render children()}
  </div>
</div>