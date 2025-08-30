<!-- 오브젝트 목록 컴포넌트 -->
<script lang="ts">
  import type { ObjectInfo, FolderInfo, DirectoryItem } from '$lib/server/index';
  import { formatBytes } from '$lib/utils/formatters';
  import { goto } from '$app/navigation';
  import { getPresignedUrl } from '$lib/utils/presignedUrl';
  
  // Svelte 5 Runes 사용
  interface Props {
    objects?: ObjectInfo[];
    bucketName?: string;
    directory?: DirectoryItem;
    currentPrefix?: string;
    onSelectionChange?: (selectedObjects: string[]) => void;
  }
  
  let { 
    objects = [], 
    bucketName = '', 
    directory = undefined, 
    currentPrefix = '',
    onSelectionChange = () => {}
  }: Props = $props();
  
  // 폴더/파일 통합 아이템 리스트 - $derived 사용
  let items = $derived(directory?.items || objects.map(obj => obj as ObjectInfo | FolderInfo));
  
  // 폴더 클릭 시 하위 폴더로 이동
  function handleFolderClick(folder: FolderInfo) {
    const newUrl = `/browser/${bucketName}?prefix=${encodeURIComponent(folder.prefix)}`;
    goto(newUrl);
  }
  
  // 파일 클릭 시 상세 페이지로 이동
  function handleFileClick(file: ObjectInfo) {
    // URL 인코딩을 통해 한글 파일명도 지원
    const encodedObjectName = encodeURIComponent(file.key);
    goto(`/browser/${bucketName}/${encodedObjectName}`);
  }
  
  // 아이템 클릭 핸들러 (폴더/파일 구분)
  function handleItemClick(item: ObjectInfo | FolderInfo) {
    if ('type' in item && item.type === 'folder') {
      handleFolderClick(item);
    } else {
      handleFileClick(item as ObjectInfo);
    }
  }
  
  // 폴더 다운로드 핸들러 (개별 파일 다운로드 방식)
  async function handleFolderDownload(folder: FolderInfo, event: Event) {
    event.stopPropagation(); // 폴더 클릭 이벤트 방지
    
    try {      
      // 폴더 내 파일 목록 조회
      const response = await fetch('/api/list-folder-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bucketName: bucketName,
          folderPrefix: folder.prefix
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`폴더 파일 목록 조회 실패: ${errorText}`);
      }
      
      const folderData = await response.json();
      const files = folderData.files as string[];
      
      if (files.length === 0) {
        alert('다운로드할 파일이 없습니다.');
        return;
      }
      
      // 각 파일을 개별적으로 다운로드
      let downloadedCount = 0;
      let failedCount = 0;
      
      for (const fileKey of files) {
        try {
          // presigned URL 생성
          const url = await getPresignedUrl({
            operation: 'download',
            bucketName: bucketName!,
            key: fileKey,
            expiresIn: 3600 // 1시간
          });
          
          // fetch로 파일 데이터 받아오기
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`${fileKey} 다운로드 실패: ${response.statusText}`);
          }
          
          // blob으로 변환
          const blob = await response.blob();
          
          // 파일명 추출
          const filename = fileKey.split('/').pop() || fileKey;
          
          // blob을 이용한 다운로드 실행
          if (typeof window !== 'undefined') {
            const blobUrl = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // 메모리 정리
            window.URL.revokeObjectURL(blobUrl);
          }
          
          downloadedCount++;
          
          // 브라우저 다운로드 제한 방지를 위한 딜레이
          if (downloadedCount < files.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
        } catch (err) {
          console.error(`${fileKey} 다운로드 실패:`, err);
          failedCount++;
        }
      }
      
      
    } catch (err) {
      console.error('폴더 다운로드 중 오류:', err);
      alert(err instanceof Error ? err.message : '폴더 다운로드 중 오류가 발생했습니다.');
    }
  }
  
  // 타입 가드 함수들
  function isFolder(item: ObjectInfo | FolderInfo): item is FolderInfo {
    return 'type' in item && item.type === 'folder';
  }
  
  function isFile(item: ObjectInfo | FolderInfo): item is ObjectInfo {
    return 'size' in item;
  }
  
  // 아이템 타입에 따른 아이콘과 스타일
  function getItemTypeInfo(item: ObjectInfo | FolderInfo): { type: string; class: string; icon: string } {
    if (isFolder(item)) {
      return { 
        type: 'DIR', 
        class: 'bg-blue-100 text-blue-800',
        icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
      };
    }
    
    // 파일인 경우 확장자로 판별
    const key = (item as ObjectInfo).key;
    return getFileTypeInfoByExtension(key);
  }
  
  // 파일 확장자에 따른 타입, 스타일 클래스, 아이콘
  function getFileTypeInfoByExtension(key: string): { type: string; class: string; icon: string } {
    
    const ext = key.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
      return { 
        type: 'IMG', 
        class: 'bg-green-100 text-green-800',
        icon: 'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'
      };
    }
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)) {
      return { 
        type: 'VID', 
        class: 'bg-purple-100 text-purple-800',
        icon: 'M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z'
      };
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
      return { 
        type: 'AUD', 
        class: 'bg-pink-100 text-pink-800',
        icon: 'M18.666 2.23l-1.2-1.2c-.6-.6-1.567-.6-2.166 0L8.25 8.077a4.5 4.5 0 00-3.29 1.44A2.25 2.25 0 001.5 12v1.5A2.25 2.25 0 003.75 16h1.5a4.501 4.501 0 003.29-1.44l7.166-7.166c.6-.6.6-1.567 0-2.167z M16.5 3.5L17 4l1.5 1.5-.5.5L16.5 4.5l-.5-.5.5-.5z'
      };
    }
    if (['pdf'].includes(ext)) {
      return { 
        type: 'PDF', 
        class: 'bg-red-100 text-red-800',
        icon: 'M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z'
      };
    }
    if (['doc', 'docx'].includes(ext)) {
      return { 
        type: 'DOC', 
        class: 'bg-blue-100 text-blue-800',
        icon: 'M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
      };
    }
    if (['xls', 'xlsx'].includes(ext)) {
      return { 
        type: 'XLS', 
        class: 'bg-green-100 text-green-800',
        icon: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z'
      };
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return { 
        type: 'PPT', 
        class: 'bg-orange-100 text-orange-800',
        icon: 'M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h2z'
      };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { 
        type: 'ZIP', 
        class: 'bg-yellow-100 text-yellow-800',
        icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z M8 11v2h8v-2H8z'
      };
    }
    if (['txt', 'md', 'json', 'xml', 'csv'].includes(ext)) {
      return { 
        type: 'TXT', 
        class: 'bg-gray-100 text-gray-800',
        icon: 'M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5z'
      };
    }
    
    return { 
      type: ext.toUpperCase() || 'FILE', 
      class: 'bg-gray-100 text-gray-600',
      icon: 'M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z'
    };
  }

  // 선택된 항목 저장 - $state 사용
  let selectedObjects = $state<string[]>([]);

  // 모든 아이템이 선택 가능 (파일 + 폴더) - $derived 사용
  let selectableItems = $derived(items);

  // 전체 선택 상태를 computed value로 계산 - $derived 사용
  let allSelected = $derived(
    selectedObjects.length === selectableItems.length && selectableItems.length > 0
  );

  // selectedObjects 변경 시 부모에게 알림 - $effect 사용
  $effect(() => {
    onSelectionChange(selectedObjects);
  });

  // 아이템의 고유 식별자 생성 (파일: key, 폴더: prefix)
  function getItemId(item: ObjectInfo | FolderInfo): string {
    if (isFolder(item)) {
      return `folder:${item.prefix}`;
    } else {
      return item.key;
    }
  }

  // 전체 선택 체크박스 클릭 핸들러
  function handleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      // 체크됨 → 모든 항목 선택 (파일 + 폴더)
      selectedObjects = selectableItems.map(item => getItemId(item));
    } else {
      // 체크 해제됨 → 모든 항목 해제
      selectedObjects = [];
    }
  }
</script>

{#if items.length > 0}
  <table class="w-full border-collapse">
    <thead class="sticky top-0">
      <tr class="grid grid-cols-12 w-full">
        <!-- 체크박스 전체 선택 -->
        <th class="col-span-1 p-3 bg-white-50 font-bold text-center border-b border-gray-200">
          <input 
            type="checkbox" 
            checked={allSelected}
            onchange={handleSelectAll}
          />
        </th>
        <th class="col-span-4 p-3 bg-white-50 font-bold text-left border-b border-gray-200">이름</th>
        <th class="col-span-4 p-3 bg-white-50 font-bold text-left border-b border-gray-200">마지막 수정</th>
        <th class="col-span-3 p-3 bg-white-50 font-bold text-left border-b border-gray-200">크기</th>
      </tr>
    </thead>
    <tbody>
      {#each items as item}
        <tr 
          class="grid grid-cols-12 w-full hover:bg-gray-50 cursor-pointer" 
          onclick={() => handleItemClick(item)}
        >
          <!-- 각 row 체크박스 (파일과 폴더 모두 선택 가능) -->
          <td class="col-span-1 p-3 border-b border-gray-200 text-center">
            <input 
              type="checkbox" 
              bind:group={selectedObjects} 
              value={getItemId(item)}
              onclick={(e) => e.stopPropagation()}
            />
          </td>
          <td class="col-span-4 p-3 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center flex-1">
                <svg class="w-4 h-4 mr-3 flex-shrink-0 {getItemTypeInfo(item).class.split(' ').slice(1).join(' ')}" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="{getItemTypeInfo(item).icon}" clip-rule="evenodd" />
                </svg>
                <span class="truncate font-medium">
                  {#if isFolder(item)}
                    {item.name}
                  {:else}
                    {item.key}
                  {/if}
                </span>
              </div>
            </div>
          </td>
          <td class="col-span-4 p-3 border-b border-gray-200">
            {#if isFile(item) && item.lastModified}
              {new Date(item.lastModified).toLocaleString()}
            {:else if isFolder(item)}
              <span class="text-gray-400">-</span>
            {/if}
          </td>
          <td class="col-span-3 p-3 border-b border-gray-200 text-left">
            {#if isFile(item)}
              {formatBytes(item.size)}
            {:else}
              <span class="text-gray-400">폴더</span>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <div class="p-5 bg-gray-50 rounded text-gray-600 text-center">
    {#if currentPrefix}
      이 폴더가 비어있습니다.
    {:else}
      이 버킷에 객체가 없습니다.
    {/if}
  </div>
{/if}