<!-- 모달 컴포넌트 -->
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  
  export let isOpen: boolean = false;
  export let title: string = '';
  export let onClose: () => void = () => {};
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  
  const dispatch = createEventDispatcher();
  
  // ESC 키를 눌렀을 때 모달 닫기
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      onClose();
      dispatch('close');
    }
  }
  
  // 모달 외부 클릭 시 닫기
  function handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-backdrop')) {
      onClose();
      dispatch('close');
    }
  }
  
  // 모달이 열릴 때 스크롤 방지
  $: if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  
  // 컴포넌트 마운트 시 이벤트 리스너 등록
  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });
  
  // 컴포넌트 언마운트 시 이벤트 리스너 및 스타일 제거
  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
  });
  
  // 모달 크기에 따른 클래스
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
</script>

{#if isOpen}
  <!-- 모달 백드롭 -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black bg-opacity-50"
    on:click={handleOutsideClick}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    transition:fade={{ duration: 200 }}
  >
    <!-- 모달 컨테이너 -->
    <div 
      class="bg-white rounded-lg shadow-xl w-full {sizeClasses[size]} overflow-hidden"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      <!-- 모달 헤더 -->
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 class="text-lg font-medium text-gray-900">{title}</h3>
        <button 
          type="button" 
          class="text-gray-400 hover:text-gray-500 focus:outline-none"
          aria-label="닫기"
          on:click={() => {
            onClose();
            dispatch('close');
          }}
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- 모달 본문 -->
      <div class="px-6 py-4">
        <slot />
      </div>
      
      <!-- 모달 푸터 (있을 경우) -->
      {#if $$slots.footer}
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}
