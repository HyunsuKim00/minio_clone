// Svelte 5 Runes - 최소한의 전역 상태 관리
let _fileFilter = $state('');

export const fileFilter = {
  get value() {
    return _fileFilter;
  },
  set(newValue: string) {
    _fileFilter = newValue;
  }
};
