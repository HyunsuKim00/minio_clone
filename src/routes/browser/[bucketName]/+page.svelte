<script lang="ts">
    import ObjectList from '$lib/components/bucket/ObjectList.svelte';
    import { fileFilterStore } from '$lib/stores/filterStore.svelte';
    import { goto } from '$app/navigation';

    let { data } = $props<{ data: any }>();

    // 전역 필터 스토어에서 값 가져오기 - Runes 방식
    let fileFilter = $derived(fileFilterStore.value);
    
    // 필터링은 이제 폴더/파일 통합 아이템에 적용 (폴더 + 파일 모두 검색)
    let filteredItems = $derived(() => {
        if (!data.directory) return data.objects || [];
        
        if (!fileFilter) return data.directory.items;
        
        const searchTerm = fileFilter.toLowerCase().trim();
        
        return data.directory.items.filter((item: any) => {
            if ('type' in item && item.type === 'folder') {
                // 폴더인 경우: name 속성 검색
                return item.name.toLowerCase().includes(searchTerm);
            } else if ('key' in item) {
                // 파일인 경우: key (전체 경로) 검색
                const fileName = item.key.split('/').pop() || item.key; // 파일명만 추출
                return fileName.toLowerCase().includes(searchTerm) || 
                       item.key.toLowerCase().includes(searchTerm); // 전체 경로도 검색
            }
            return false;
        });
    });
    
    // 선택 변경을 부모(레이아웃)에게 전달
    function handleSelectionChange(selectedObjects: string[]) {
        // 브라우저에서만 실행 (SSR 방지)
        if (typeof document !== 'undefined') {
            // 부모에게 커스텀 이벤트 발송
            const event = new CustomEvent('selectionChange', {
                detail: selectedObjects,
                bubbles: true
            });
            document.dispatchEvent(event);
        }
    }
    
    // Breadcrumb 클릭 핸들러
    function handleBreadcrumbClick(prefix: string) {
        const newUrl = prefix 
            ? `/browser/${data.bucketName}?prefix=${encodeURIComponent(prefix)}`
            : `/browser/${data.bucketName}`;
        goto(newUrl);
    }
    
    // 폴더 생성 모달 상태
    let showCreateFolderModal = $state(false);
    let newFolderName = $state('');
    let creatingFolder = $state(false);
    
    // 폴더 생성 모달 열기
    function handleCreateFolder() {
        showCreateFolderModal = true;
        newFolderName = '';
    }
    
    // 폴더 생성 확인
    async function confirmCreateFolder() {
        if (!newFolderName.trim() || creatingFolder) return;
        
        try {
            creatingFolder = true;
            
            const response = await fetch('/api/create-folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bucketName: data.bucketName,
                    folderName: newFolderName.trim(),
                    currentPrefix: data.currentPrefix || ''
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '폴더 생성에 실패했습니다');
            }
            
            // 모달 닫기
            showCreateFolderModal = false;
            newFolderName = '';
            
            // 페이지 새로고침으로 폴더 목록 업데이트
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
            
        } catch (err) {
            console.error('폴더 생성 중 오류:', err);
            alert(err instanceof Error ? err.message : '폴더 생성 중 오류가 발생했습니다.');
        } finally {
            creatingFolder = false;
        }
    }
    
    // 폴더 생성 취소
    function cancelCreateFolder() {
        showCreateFolderModal = false;
        newFolderName = '';
    }
</script>

<div class="flex-1 p-5 overflow-auto">
    <!-- 경로 바와 폴더 생성 버튼 (분리된 박스들) -->
    <div class="flex items-center gap-3 mb-4">
        <!-- 경로 박스 -->
        <div class="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div class="flex items-center space-x-2 text-sm">
                <svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <div class="flex items-center space-x-1 min-w-0">
                    <button 
                        class="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        onclick={() => handleBreadcrumbClick('')}
                    >
                        {data.bucketName}
                    </button>
                    {#if data.directory?.breadcrumbs && data.directory.breadcrumbs.length > 1}
                        {#each data.directory.breadcrumbs.slice(1) as breadcrumb}
                            <span class="text-gray-400">/</span>
                            <button 
                                class="text-blue-600 hover:text-blue-800 font-medium hover:underline truncate"
                                onclick={() => handleBreadcrumbClick(breadcrumb.prefix)}
                            >
                                {breadcrumb.name}
                            </button>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
        
        <!-- 폴더 생성 버튼 (독립적) -->
        <button 
            onclick={handleCreateFolder}
            class="inline-flex items-center h-11 px-3 py-2 border border-gray-600 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200 flex-shrink-0"
            title="새 폴더 생성"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            폴더 생성
        </button>
    </div>
    
    <!-- 객체 목록 컴포넌트 -->
    {#if fileFilter && filteredItems().length === 0}
        <div class="p-5 mt-20 bg-white rounded text-gray-600 text-center">검색 결과가 없습니다.</div>
    {:else}
        <ObjectList 
            objects={data.objects || []}
            directory={{
                items: filteredItems(),
                currentPrefix: data.directory?.currentPrefix || '',
                breadcrumbs: data.directory?.breadcrumbs || []
            }}
            currentPrefix={data.currentPrefix || ''}
            bucketName={data.bucketName}
            onSelectionChange={handleSelectionChange}
        />
    {/if}
</div>

<!-- 폴더 생성 모달 -->
{#if showCreateFolderModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">새 폴더 생성</h3>
                
                <div class="mb-4">
                    <label for="folder-name-input" class="block text-sm font-medium text-gray-700 mb-2">
                        폴더명
                    </label>
                    <input 
                        id="folder-name-input"
                        type="text" 
                        bind:value={newFolderName}
                        placeholder="폴더명을 입력하세요"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onkeydown={(e) => {
                            if (e.key === 'Enter') {
                                confirmCreateFolder();
                            } else if (e.key === 'Escape') {
                                cancelCreateFolder();
                            }
                        }}
                    />
                    <p class="mt-1 text-xs text-gray-500">
                        영문, 숫자, 한글, 하이픈(-), 언더스코어(_), 공백 사용 가능
                    </p>
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button 
                        onclick={cancelCreateFolder}
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                        disabled={creatingFolder}
                    >
                        취소
                    </button>
                    <button 
                        onclick={confirmCreateFolder}
                        disabled={!newFolderName.trim() || creatingFolder}
                        class="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        {creatingFolder ? '생성 중...' : '생성'}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}