import type AWS from 'aws-sdk';
import type { ObjectInfo, FolderInfo, DirectoryItem } from './types';

// 폴더와 파일을 구분하여 조회
// 전체 버킷 내 목록을 보여줄 때 사용
// 특정 폴더 내 목록을 보여줄 때도 사용
export async function listDirectory(s3Client: AWS.S3, bucketName: string, prefix: string = ''): Promise<DirectoryItem> {
  try {
    // Delimiter를 추가하여 폴더/파일 구분
    const data = await s3Client.listObjectsV2({
      Bucket: bucketName,
      Prefix: prefix, // 특정 접두사(경로)로 시작하는 객체만 조회
      Delimiter: '/'  // 핵심: 폴더 구조 인식
    }).promise();

    // 폴더 정보 처리 (CommonPrefixes)
    const folders: FolderInfo[] = (data.CommonPrefixes || []).map(commonPrefix => {
      const folderPrefix = commonPrefix.Prefix || '';
      const folderName = folderPrefix.replace(prefix, '').replace('/', ''); // 앞의 경로를 제거하고 폴더 이름만 남김.
      
      return {
        prefix: folderPrefix,
        name: folderName,
        type: 'folder' as const
      };
    });
    
    // 파일 정보 처리 (Contents)
    // data.Contents : 파일 목록
    const files: ObjectInfo[] = (data.Contents || [])
      .filter(item => {
        // 현재 폴더의 직접적인 파일만 (하위 폴더 파일 제외)
        const key = item.Key || '';
        const relativePath = key.replace(prefix, ''); // prefix를 제외한 상대 경로
        return relativePath && !relativePath.includes('/');
      })
      // 각 항목을 ObjectInfo 객체로 변환
      .map(item => ({
        key: item.Key || '',
        size: item.Size || 0,
        lastModified: item.LastModified,
        etag: item.ETag
      }));
    
    // 현재 경로를 기반으로 네비게이션 경로 생성 (경로별 breadcrumb 생성)
    const breadcrumbs = generateBreadcrumbs(prefix);
    
    // 폴더와 파일을 합쳐서 정렬 (폴더 먼저, 그 다음 파일)
    const items: (ObjectInfo | FolderInfo)[] = [
      ...folders.sort((a, b) => a.name.localeCompare(b.name)),
      ...files.sort((a, b) => a.key.localeCompare(b.key))
    ];
    
    return {
      items,
      currentPrefix: prefix,
      breadcrumbs
    };
    
  } catch (error) {
    // NoSuchBucket 에러는 정상적인 상황 (버킷이 삭제되었거나 존재하지 않음)
    // 불필요한 에러 로그를 남기지 않고 에러를 그대로 던짐
    if (error instanceof Error && 
        (error.message.includes('NoSuchBucket') || 
         error.message.includes('does not exist') ||
         (error as any).code === 'NoSuchBucket')) {
      throw error;
    }
    
    // 실제 예상치 못한 에러만 로깅
    console.error(`Error listing directory in bucket ${bucketName}:`, error);
    throw error;
  }
}

// Breadcrumb 경로 생성 유틸리티
function generateBreadcrumbs(prefix: string): { name: string; prefix: string }[] {
  // 초기값: 홈 디렉토리
  const breadcrumbs: { name: string; prefix: string }[] = [
    { name: '홈', prefix: '' }
  ];
  
  if (!prefix) return breadcrumbs;
  
  // 슬래시로 경로를 분할하고, 빈 문자열은 제거
  const parts = prefix.split('/').filter(part => part.length > 0);
  let currentPrefix = '';
  
  for (const part of parts) {
    currentPrefix += part + '/';
    breadcrumbs.push({
      name: part,
      prefix: currentPrefix
    });
  }
  
  return breadcrumbs;
}

/**
S3는 실제로는 평면적(flat) 구조입니다. 폴더라는 개념이 없고, 모든 것이 키(key)를 가진 객체임.
my-bucket/
├── file1.txt
├── documents/report.pdf
├── documents/presentation.pptx
├── images/photo1.jpg
├── images/photo2.jpg
├── images/thumbnails/thumb1.jpg
└── videos/movie.mp4
위와 같은 버킷이 있다고 가정할 때, S3에는 아래와 같이 저장된다.
- Key: "file1.txt"
- Key: "documents/report.pdf"
- Key: "documents/presentation.pptx"
- Key: "images/photo1.jpg"
- Key: "images/photo2.jpg"
- Key: "images/thumbnails/thumb1.jpg"
- Key: "videos/movie.mp4"

그런데 listObjectsV2에서 Delimiter: '/'를 사용하면, S3는 슬래시를 폴더 구분자로 인식한다.
[코드 예시 1]
s3.listObjectsV2({
  Bucket: 'my-bucket',
  Prefix: '',
  Delimiter: '/'
})

[결과 1]
{
  Contents: [
    { Key: "file1.txt", Size: 1024, ... }
  ],
  CommonPrefixes: [
    { Prefix: "documents/" },
    { Prefix: "images/" },
    { Prefix: "videos/" }
  ]
}

[코드 예시 2]
s3.listObjectsV2({
  Bucket: 'my-bucket',
  Prefix: 'images/',
  Delimiter: '/'
})

[결과 2]
{
  Contents: [
    { Key: "images/photo1.jpg", Size: 1500, ... },
    { Key: "images/photo2.jpg", Size: 1600, ... }
  ],
  CommonPrefixes: [
    { Prefix: "images/thumbnails/" }
  ]
}

이렇게 Contents에는 파일만 나오고, CommonPrefixes에는 폴더만 나온다.
 */