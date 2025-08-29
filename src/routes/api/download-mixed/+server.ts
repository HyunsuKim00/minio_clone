import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createS3Client } from '$lib/server/s3_client';
import archiver from 'archiver';

// 혼합 다운로드 API (파일 + 폴더를 하나의 ZIP으로)
export async function POST({ request }: RequestEvent) {
  try {
    const body = await request.json();
    const { bucketName, fileKeys = [], folderPrefixes = [] } = body;
    
    // 필수 파라미터 검증
    if (!bucketName || (fileKeys.length === 0 && folderPrefixes.length === 0)) {
      throw error(400, '필수 파라미터가 누락되었습니다: bucketName, fileKeys 또는 folderPrefixes');
    }
    
    // 총 아이템 개수 제한 (성능 고려)
    if (fileKeys.length + folderPrefixes.length > 50) {
      throw error(400, '한 번에 다운로드할 수 있는 항목은 최대 50개입니다');
    }
    
    const s3Client = createS3Client();
    const allObjects: { key: string; name: string }[] = [];
    
    // 1. 개별 파일들 추가
    for (const fileKey of fileKeys) {
      allObjects.push({
        key: fileKey,
        name: fileKey.split('/').pop() || fileKey
      });
    }
    
    // 2. 폴더들의 모든 파일 조회 및 추가
    for (const folderPrefix of folderPrefixes) {
      const listParams = {
        Bucket: bucketName,
        Prefix: folderPrefix
      };
      
      let continuationToken: string | undefined;
      
      do {
        const data = await s3Client.listObjectsV2({
          ...listParams,
          ContinuationToken: continuationToken
        }).promise();
        
        if (data.Contents) {
          // .placeholder 파일은 제외하고 실제 파일만 추가
          const folderFiles = data.Contents
            .filter(obj => obj.Key && !obj.Key.endsWith('.placeholder'))
            .map(obj => ({
              key: obj.Key!,
              name: obj.Key! // 폴더 자체를 포함한 전체 경로 유지
            }));
          
          allObjects.push(...folderFiles);
        }
        
        continuationToken = data.NextContinuationToken;
      } while (continuationToken);
    }
    
    if (allObjects.length === 0) {
      throw error(404, '다운로드할 파일이 없습니다');
    }
    
    // ZIP 파일 스트림 생성
    const archive = archiver('zip', {
      zlib: { level: 9 } // 최대 압축
    });
    
    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${bucketName}-mixed.zip"`);
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
    
    // 각 파일을 ZIP에 추가
    const addFilesToZip = async () => {
      try {
        for (const obj of allObjects) {
          // S3에서 파일 스트림 가져오기
          const objectStream = s3Client.getObject({
            Bucket: bucketName,
            Key: obj.key
          }).createReadStream();
          
          // ZIP에 파일 추가 (적절한 경로로)
          archive.append(objectStream, { name: obj.name });
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
    console.error('혼합 다운로드 API 오류:', err);
    
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
      throw error(
        (err.status as number) || 500,
        (err.message as string) || '다운로드 중 오류가 발생했습니다'
      );
    } else {
      throw error(500, '다운로드 중 오류가 발생했습니다');
    }
  }
}
