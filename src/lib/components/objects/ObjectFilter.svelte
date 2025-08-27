<!-- 오브젝트 필터 컴포넌트 -->
<script lang="ts">
  export let onChange: (filter: string) => void;
  let filterValue = '';
  
  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    filterValue = target.value;
    onChange(filterValue);
  }
</script>

<!-- 내용은 추후 구현 -->
