import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createS3Client } from '$lib/server/s3_client';
import archiver from 'archiver';

// 폴더 다운로드 API (폴더 구조를 유지한 ZIP 다운로드)
export async function POST({ request }: RequestEvent) {
  try {
    const body = await request.json();
    const { bucketName, folderPrefix } = body;
    
    // 필수 파라미터 검증
    if (!bucketName || !folderPrefix) {
      throw error(400, '필수 파라미터가 누락되었습니다: bucketName, folderPrefix');
    }
    
    const s3Client = createS3Client();
    
    // 폴더 내 모든 객체 조회
    const listParams = {
      Bucket: bucketName,
      Prefix: folderPrefix
    };
    
    const allObjects: any[] = [];
    let continuationToken: string | undefined;
    
    do {
      const data = await s3Client.listObjectsV2({
        ...listParams,
        ContinuationToken: continuationToken
      }).promise();
      
      if (data.Contents) {
        // .placeholder 파일은 제외
        const filteredObjects = data.Contents.filter(obj => 
          obj.Key && !obj.Key.endsWith('.placeholder')
        );
        allObjects.push(...filteredObjects);
      }
      
      continuationToken = data.NextContinuationToken;
    } while (continuationToken);
    
    if (allObjects.length === 0) {
      throw error(404, '폴더가 비어있거나 존재하지 않습니다');
    }
    
    // ZIP 파일 스트림 생성
    const archive = archiver('zip', {
      zlib: { level: 9 } // 최대 압축
    });
    
    // 폴더명 추출 (마지막 '/' 제거)
    const folderName = folderPrefix.replace(/\/$/, '').split('/').pop() || 'folder';
    
    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${folderName}.zip"`);
    headers.set('Cache-Control', 'no-cache');
    
    // 스트림을 웹 응답으로 변환하기 위한 ReadableStream 생성
    const readableStream = new ReadableStream({
      start(controller) {
        // 에러 핸들링
        archive.on('error', (err) => {
          console.error('ZIP 압축 중 오류:', err);
          controller.error(err);
        });
        
        // 데이터 스트림을 controller로 전달
        archive.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        
        // 압축 완료 시 스트림 종료
        archive.on('end', () => {
          controller.close();
        });
      }
    });
    
    // 각 파일을 ZIP에 추가 (폴더 자체 포함)
    const addFilesToZip = async () => {
      try {
        for (const obj of allObjects) {
          const objectKey = obj.Key!;
          
          // S3에서 파일 스트림 가져오기
          const objectStream = s3Client.getObject({
            Bucket: bucketName,
            Key: objectKey
          }).createReadStream();
          
          // 폴더 자체를 포함한 전체 경로 사용
          // 예: "folder1/subfolder/file.txt" → "folder1/subfolder/file.txt" (그대로 유지)
          const zipPath = objectKey;
          
          // ZIP에 파일 추가 (폴더 자체 포함)
          archive.append(objectStream, { name: zipPath });
        }
        
        // 모든 파일 추가 완료 후 ZIP 압축 종료
        await archive.finalize();
        
      } catch (err) {
        console.error('파일 추가 중 오류:', err);
        archive.destroy(err instanceof Error ? err : new Error('파일 추가 중 오류가 발생했습니다'));
      }
    };
    
    // 비동기로 파일 추가 시작
    addFilesToZip();
    
    // ZIP 스트림을 응답으로 반환
    return new Response(readableStream, {
      status: 200,
      headers
    });
    
  } catch (err: unknown) {
    console.error('폴더 다운로드 API 오류:', err);
    
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
      throw error(
        (err.status as number) || 500,
        (err.message as string) || '폴더를 다운로드하는 중 오류가 발생했습니다'
      );
    } else {
      throw error(500, '폴더를 다운로드하는 중 오류가 발생했습니다');
    }
  }
}
