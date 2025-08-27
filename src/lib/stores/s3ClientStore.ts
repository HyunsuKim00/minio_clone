import { writable } from 'svelte/store';
import type AWS from 'aws-sdk';
import { createDefaultS3Client } from '$lib/s3_sdk/client';

// S3 클라이언트를 저장할 스토어
export const s3ClientStore = writable<AWS.S3 | null>(null);

// 클라이언트 초기화 함수
export function initializeS3Client(): AWS.S3 {
  const client = createDefaultS3Client();
  s3ClientStore.set(client);
  return client;
}

// 클라이언트 가져오기 함수 (없으면 생성)
export function getS3Client(): AWS.S3 {
  let client: AWS.S3 | null = null;
  
  // 스토어에서 현재 값 가져오기
  s3ClientStore.subscribe(value => {
    client = value;
  })();
  
  // 클라이언트가 없으면 초기화
  if (!client) {
    client = initializeS3Client();
  }
  
  return client;
}
