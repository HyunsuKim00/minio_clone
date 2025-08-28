<script lang="ts">
    import ObjectList from '$lib/components/objects/ObjectList.svelte';
    import type { ObjectInfo } from '$lib/server/index';
    import { writable } from 'svelte/store';

    let { data } = $props<{ data: any }>();

    const fileFilterStore = writable('');
    let fileFilter = $state('');
    fileFilterStore.subscribe(value => {
        fileFilter = value;
    });
    
    // 필터 값에 따라 객체 목록 필터링 (실시간으로 반응)
    let filteredObjects = $derived(
        data.objects?.filter((obj: { key: string }) => 
            fileFilter ? obj.key.toLowerCase().includes(fileFilter.toLowerCase()) : true
        ) || []
    );
    
    // 객체 선택 처리
    function handleSelectObject(object: ObjectInfo) {
        console.log('선택된 객체:', object);
        // 추후 객체 상세 정보 표시 또는 다른 작업 구현 가능
    }
</script>

<div class="flex-1 p-5 overflow-auto">
    <!-- 객체 목록 컴포넌트 -->
    {#if fileFilter && filteredObjects.length === 0}
        <div class="p-5 bg-gray-50 rounded text-gray-600 text-center">검색 결과가 없습니다.</div>
    {:else}
        <ObjectList 
            objects={filteredObjects} 
            bucketName={data.bucketName}
            onSelectObject={handleSelectObject} 
        />
    {/if}
</div>