<script lang="ts">
  import BucketHeader from '$lib/components/bucket/BucketHeader.svelte';
  import { getPresignedUrl } from '$lib/utils/presignedUrl';
  import { onMount } from 'svelte';
  
  // SvelteKit 런타임 속성
  let { data, children } = $props();
  
  // 파일 업로드 관련 상태
  let fileInput: HTMLInputElement | null = null;
  let folderInput: HTMLInputElement | null = null; // 폴더 업로드용
  let uploading = false;
  

  
  // 새로 추가: 선택된 객체 관리
  let selectedObjects = $state<string[]>([]);
  let bulkDeleting = $state(false);
  let bulkDownloading = $state(false);
  
  // 데이터 형식 변환
  const createdDateStr = typeof data.createdDate === 'string' ? data.createdDate : 
                         data.createdDate instanceof Date ? data.createdDate.toISOString() : '';
  
  // 이벤트 핸들러 함수들
  function handleRefresh() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
  
  function handleUpload() {
    // 파일 선택 창 직접 열기
    if (fileInput) {
      fileInput.click();
    }
  }
  
  // 폴더 업로드 (webkitdirectory)
  function handleUploadFolder() {
    if (folderInput) {
      folderInput.click();
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
        // 파일 경로 및 이름 설정 (현재 prefix 적용)
        const key = (data.currentPrefix || '') + file.name;
        
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
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      
    } catch (err) {
      console.error('파일 업로드 중 오류:', err);
      alert(err instanceof Error ? err.message : '파일 업로드 중 오류가 발생했습니다.');
    } finally {
      uploading = false;
    }
  }
  
  // 폴더 업로드 핸들러
  async function handleFolderSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    
    if (!files || files.length === 0) return;
    
    try {
      uploading = true;      
      // 모든 파일 업로드 진행 (폴더 구조 유지)
      const uploadPromises = Array.from(files).map(async (file) => {
        // webkitRelativePath를 사용하여 폴더 구조 유지
        const relativePath = (file as any).webkitRelativePath || file.name;
        const key = (data.currentPrefix || '') + relativePath;
        
        // 1. 서버에게 pre-signed URL 요청
        const url = await getPresignedUrl({
          operation: 'upload',
          bucketName: data.bucketName,
          key,
          contentType: file.type,
          expiresIn: 300
        });
        
        // 2. pre-signed URL을 사용하여 직접 MinIO에 업로드
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type
          },
          body: file
        });
        
        if (!response.ok) {
          throw new Error(`${key} 업로드 실패: ${response.statusText}`);
        }
      });
      
      // 모든 업로드가 완료될 때까지 대기
      await Promise.all(uploadPromises);
      
      // 폴더 입력 초기화
      if (folderInput) {
        folderInput.value = '';
      }
      
      // 업로드 완료 후 페이지 새로고침
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      
    } catch (err) {
      console.error('폴더 업로드 중 오류:', err);
      alert(err instanceof Error ? err.message : '폴더 업로드 중 오류가 발생했습니다.');
    } finally {
      uploading = false;
    }
  }
  
  // 선택 변경 핸들러
  function handleSelectionChange(selected: string[]) {
    selectedObjects = selected;
  }
  
  // 일괄 다운로드 핸들러 (파일 + 폴더 지원)
  async function handleBulkDownload() {
    if (selectedObjects.length === 0 || bulkDownloading) return;
    
    try {
      bulkDownloading = true;
      
      // 선택된 항목들을 파일과 폴더로 분리
      const fileKeys: string[] = [];
      const folderPrefixes: string[] = [];
      
      for (const item of selectedObjects) {
        if (item.startsWith('folder:')) {
          // 폴더 항목
          const prefix = item.replace('folder:', '');
          folderPrefixes.push(prefix);
        } else {
          // 파일 항목
          fileKeys.push(item);
        }
      }
      
      // 단일 파일이고 폴더가 없는 경우만 기존 방식 사용
      if (fileKeys.length === 1 && folderPrefixes.length === 0) {
        const objectKey = fileKeys[0];
        const url = await getPresignedUrl({
          operation: 'download',
          bucketName: data.bucketName,
          key: objectKey,
          expiresIn: 300
        });
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`${objectKey} 다운로드 실패: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        // 브라우저에서만 실행 (SSR 방지)
        if (typeof window !== 'undefined') {
          const blobUrl = window.URL.createObjectURL(blob);
          
          // 파일 이름 추출
          const fileName = objectKey.split('/').pop() || objectKey;
          
          // 다운로드 링크 생성
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // 메모리 정리
          window.URL.revokeObjectURL(blobUrl);
        }
      } else {
        // 복수 항목이거나 폴더가 포함된 경우 혼합 다운로드 API 사용
        const response = await fetch('/api/download-mixed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bucketName: data.bucketName,
            fileKeys,
            folderPrefixes
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`다운로드 실패: ${errorText}`);
        }
        
        // ZIP 파일을 Blob으로 변환
        const blob = await response.blob();
        
        // 브라우저에서만 실행 (SSR 방지)
        if (typeof window !== 'undefined') {
          const blobUrl = window.URL.createObjectURL(blob);
          
          // ZIP 파일명 생성 (버킷명-날짜.zip)
          const today = new Date().toISOString().split('T')[0];
          const zipFileName = `${data.bucketName}-${today}.zip`;
          
          // 다운로드 링크 생성
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = zipFileName;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // 메모리 정리
          window.URL.revokeObjectURL(blobUrl);
        }
      }
      
      // 다운로드 완료 후 선택 해제
      selectedObjects = [];
    } catch (err) {
      console.error('일괄 다운로드 중 오류:', err);
      alert(err instanceof Error ? err.message : '일괄 다운로드 중 오류가 발생했습니다.');
    } finally {
      bulkDownloading = false;
    }
  }
  
  // 일괄 삭제 핸들러 (파일 + 폴더 지원)
  async function handleBulkDelete() {
    if (selectedObjects.length === 0 || bulkDeleting) return;
    
    // 선택된 항목들을 파일과 폴더로 분리
    const fileKeys: string[] = [];
    const folderPrefixes: string[] = [];
    
    for (const item of selectedObjects) {
      if (item.startsWith('folder:')) {
        const prefix = item.replace('folder:', '');
        folderPrefixes.push(prefix);
      } else {
        fileKeys.push(item);
      }
    }
    
    const confirmed = confirm(`일괄 삭제를 진행하시겠습니까?`);
    if (!confirmed) return;
    
    try {
      bulkDeleting = true;
      
      // 폴더가 포함된 경우 새로운 혼합 삭제 API 사용
      if (folderPrefixes.length > 0) {
        const response = await fetch('/api/delete-mixed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bucketName: data.bucketName,
            fileKeys,
            folderPrefixes
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`삭제 실패: ${errorText}`);
        }
      } else {
        // 파일만 있는 경우 기존 API 사용
        const formData = new FormData();
        formData.append('objectKeys', JSON.stringify(fileKeys));
        
        const response = await fetch(`/browser/${data.bucketName}?/bulkDeleteObjects`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('일괄 삭제에 실패했습니다.');
        }
      }
      
      // 삭제 성공 시 페이지 새로고침
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      
    } catch (err) {
      console.error('일괄 삭제 중 오류:', err);
      alert(err instanceof Error ? err.message : '일괄 삭제 중 오류가 발생했습니다.');
    } finally {
      bulkDeleting = false;
    }
  }
  
  // 페이지에서 발송하는 선택 변경 이벤트 수신
  onMount(() => {
    const handleSelectionEvent = (event: any) => {
      selectedObjects = event.detail;
    };
    
    document.addEventListener('selectionChange', handleSelectionEvent);
    
    return () => {
      document.removeEventListener('selectionChange', handleSelectionEvent);
    };
  });
</script>

<div class="flex flex-col h-full bg-white border border-gray-200 mx-4 overflow-hidden">
  <!-- 버킷 헤더 -->
  <BucketHeader 
    bucketName={data.bucketName || ''} 
    createdDate={createdDateStr} 
    totalSize={data.totalSize || 0} 
    objectCount={data.objectCount || 0}
    onRefresh={handleRefresh}
    onUpload={handleUpload}
    selectedObjects={selectedObjects}
    onBulkDownload={handleBulkDownload}
    onBulkDelete={handleBulkDelete}
    onUploadFolder={handleUploadFolder}
  />
  
  <!-- 숨겨진 파일 입력 -->
  <input 
    type="file" 
    class="hidden"
    multiple 
    bind:this={fileInput}
    onchange={handleFileSelect}
  />
  
  <!-- 숨겨진 폴더 입력 -->
  <input 
    type="file" 
    class="hidden"
    multiple 
    webkitdirectory
    bind:this={folderInput}
    onchange={handleFolderSelect}
  />
  
  <!-- 메인 콘텐츠 -->
  <div class="flex-1 overflow-hidden flex">
    {@render children()}
  </div>
</div>