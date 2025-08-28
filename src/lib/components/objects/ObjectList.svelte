<!-- 오브젝트 목록 컴포넌트 -->
<script lang="ts">
  import type { ObjectInfo } from '$lib/server/index';
  import { formatBytes } from '$lib/utils/formatters';
  import ObjectActions from './ObjectActions.svelte';
  
  export let objects: ObjectInfo[] = [];
  export let bucketName: string = '';
  export let onSelectObject: (object: ObjectInfo) => void = () => {};
  
  // 파일 확장자에 따른 아이콘 클래스
  function getFileType(key: string): string {
    if (key.endsWith('/')) return '📁 폴더';
    
    const ext = key.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) return '🖼️ 이미지';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) return '🎬 비디오';
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return '🎵 오디오';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return '📄 문서';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜️ 압축파일';
    
    return '📄 파일';
  }
</script>

{#if objects.length > 0}
  <table class="w-full border-collapse">
    <thead class="sticky top-0">
      <tr class="grid grid-cols-12 w-full">
        <th class="col-span-5 p-3 bg-gray-50 font-bold text-left border-b border-gray-200">이름</th>
        <th class="col-span-3 p-3 bg-gray-50 font-bold text-left border-b border-gray-200">마지막 수정</th>
        <th class="col-span-2 p-3 bg-gray-50 font-bold text-left border-b border-gray-200">크기</th>
        <th class="col-span-2 p-3 bg-gray-50 font-bold text-left border-b border-gray-200">작업</th>
      </tr>
    </thead>
    <tbody>
      {#each objects as object}
        <tr 
          class="grid grid-cols-12 w-full hover:bg-gray-50 cursor-pointer" 
          on:click={() => onSelectObject(object)}
        >
          <td class="col-span-5 p-3 border-b border-gray-200">
            <div class="flex items-center">
              <span class="mr-2 flex-shrink-0">{getFileType(object.key)}</span>
              <span class="truncate">{object.key}</span>
            </div>
          </td>
          <td class="col-span-3 p-3 border-b border-gray-200">
            {#if object.lastModified}
              {new Date(object.lastModified).toLocaleString()}
            {/if}
          </td>
          <td class="col-span-2 p-3 border-b border-gray-200 text-left">{formatBytes(object.size)}</td>
          <td class="col-span-2 p-3 border-b border-gray-200 text-center">
            <!-- 이벤트 버블링 방지 -->
            <div on:click|stopPropagation role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && e.stopPropagation()}>
              <ObjectActions {object} {bucketName} />
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <div class="p-5 bg-gray-50 rounded text-gray-600 text-center">이 버킷에 객체가 없습니다.</div>
{/if}
