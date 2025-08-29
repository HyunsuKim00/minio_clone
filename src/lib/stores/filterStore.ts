// Svelte 5 Runes 방식으로 전역 상태 관리
// .svelte.ts 파일로 변경하면 $state 사용 가능

class FilterStore {
  #value = $state('');
  
  get value() {
    return this.#value;
  }
  
  set value(newValue: string) {
    this.#value = newValue;
  }
  
  // 편의 메서드들
  clear() {
    this.#value = '';
  }
  
  update(fn: (current: string) => string) {
    this.#value = fn(this.#value);
  }
}

// 전역 파일 필터 스토어 - Svelte 5 Runes 사용
export const fileFilterStore = new FilterStore();
