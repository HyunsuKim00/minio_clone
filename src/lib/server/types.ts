// 객체 정보 타입
export interface ObjectInfo {
    key: string;
    size: number;
    lastModified?: Date;
    etag?: string;
}

// 폴더 정보 타입
export interface FolderInfo {
  prefix: string;        // "folder1/"
  name: string;         // "folder1"
  type: 'folder';
  itemCount?: number;   // 하위 아이템 개수
}

// 디렉토리 아이템 타입
export interface DirectoryItem {
  items: (ObjectInfo | FolderInfo)[];
  currentPrefix: string;
  breadcrumbs: { name: string; prefix: string }[];
}