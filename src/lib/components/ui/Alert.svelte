<!-- 알림 컴포넌트 -->
<script lang="ts">
  export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
  export let message: string = '';
  export let dismissible: boolean = true;
</script>

<!-- 내용은 추후 구현 -->
