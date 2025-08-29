import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createS3Client } from '$lib/server/s3_client';
import archiver from 'archiver';

// 복수 파일 ZIP 다운로드 API
export async function POST({ request }: RequestEvent) {
  try {
    const body = await request.json();
    const { bucketName, objectKeys } = body;
    
    // 필수 파라미터 검증
    if (!bucketName || !objectKeys || !Array.isArray(objectKeys) || objectKeys.length === 0) {
      throw error(400, '필수 파라미터가 누락되었습니다: bucketName, objectKeys (배열)');
    }
    
    // 파일 개수 제한 (성능 고려)
    if (objectKeys.length > 100) {
      throw error(400, '한 번에 다운로드할 수 있는 파일은 최대 100개입니다');
    }
    
    const s3Client = createS3Client();
    
    // ZIP 파일 스트림 생성
    const archive = archiver('zip', {
      zlib: { level: 9 } // 최대 압축
    });
    
    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${bucketName}-files.zip"`);
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
                for (const objectKey of objectKeys) {
          // S3에서 파일 스트림 가져오기
          const objectStream = s3Client.getObject({
            Bucket: bucketName,
            Key: objectKey
          }).createReadStream();
          
          // 파일명에서 경로 분리 (폴더 구조 유지)
          const fileName = objectKey.split('/').pop() || objectKey;
          
          // ZIP에 파일 추가 (스트림 방식)
          archive.append(objectStream, { name: fileName });
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
    console.error('ZIP 다운로드 API 오류:', err);
    
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
      throw error(
        (err.status as number) || 500,
        (err.message as string) || 'ZIP 파일을 생성하는 중 오류가 발생했습니다'
      );
    } else {
      throw error(500, 'ZIP 파일을 생성하는 중 오류가 발생했습니다');
    }
  }
}
