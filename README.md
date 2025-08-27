# MinIO 브라우저 클론

SvelteKit과 TailwindCSS를 사용하여 구현한 MinIO 웹 브라우저입니다. 이 애플리케이션은 MinIO 서버와 연동하여 S3 호환 스토리지를 관리합니다.

## 기능

- 버킷 목록 조회 및 생성
- 버킷 내 오브젝트 목록 조회
- 파일 업로드 및 다운로드
- 오브젝트 관리 (삭제, 공유, 태그 등)

## 프로젝트 구조

```
src/
  - app.css                    # TailwindCSS 스타일
  - app.d.ts                   # TypeScript 타입 정의
  - app.html                   # HTML 템플릿
  - lib/
    - index.ts                 # 라이브러리 내보내기
    - components/
      - layout/
        - Sidebar.svelte       # 좌측 사이드바 컴포넌트
        - ObjectSidebar.svelte # 우측 오브젝트 사이드바 컴포넌트
        - Header.svelte        # 헤더 컴포넌트
        - Footer.svelte        # 푸터 컴포넌트
      - buckets/
        - BucketList.svelte    # 버킷 목록 컴포넌트
        - BucketFilter.svelte  # 버킷 필터 컴포넌트
        - CreateBucket.svelte  # 버킷 생성 폼 컴포넌트
      - objects/
        - ObjectList.svelte    # 오브젝트 목록 컴포넌트
        - ObjectFilter.svelte  # 오브젝트 필터 컴포넌트
        - ObjectActions.svelte # 오브젝트 액션 버튼 컴포넌트
        - FileUploader.svelte  # 파일 업로드 컴포넌트
      - ui/
        - Button.svelte        # 버튼 컴포넌트
        - Modal.svelte         # 모달 컴포넌트
        - Spinner.svelte       # 로딩 스피너 컴포넌트
        - Alert.svelte         # 알림 컴포넌트
    - s3_sdk/
      - client.ts              # S3 클라이언트 생성
      - index.ts               # SDK 내보내기
      - types.ts               # 타입 정의
      - operations/
        - buckets.ts           # 버킷 관련 작업
        - objects.ts           # 오브젝트 관련 작업
        - presigned.ts         # pre-signed URL 관련 기능
    - utils/
      - formatters.ts          # 날짜, 파일크기 등 포맷팅 유틸리티
      - validators.ts          # 입력 검증 유틸리티
  - routes/
    - +layout.server.ts        # 전역 레이아웃 서버 로드 함수
    - +layout.svelte           # 전역 레이아웃 컴포넌트
    - +page.server.ts          # 메인 페이지 서버 로드 함수
    - +page.svelte             # 메인 페이지 컴포넌트
    - browser/
      - +layout.svelte         # 브라우저 공통 레이아웃
      - +layout.server.ts      # 브라우저 레이아웃 서버 로드 함수
      - [bucketName]/
        - +page.server.ts      # 버킷 페이지 서버 로드 함수
        - +page.svelte         # 버킷 페이지 컴포넌트
    - api/
      - presigned/
        - +server.ts           # pre-signed URL 생성 API
```

## 개발 환경 설정

1. 의존성 설치

```sh
npm install
```

2. 개발 서버 실행

```sh
npm run dev
```

3. 브라우저에서 확인

```
http://localhost:5173
```

## 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음 변수를 설정합니다:

```
S3_ENDPOINT=http://your-minio-server:9000
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=us-east-1
```

## 기술 스택

- SvelteKit - 프론트엔드 프레임워크
- TailwindCSS - 스타일링
- AWS SDK - S3 API 호출