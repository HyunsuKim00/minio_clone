import { writable } from 'svelte/store';

// 파일 필터링을 위한 스토어
export const fileFilterStore = writable('');
