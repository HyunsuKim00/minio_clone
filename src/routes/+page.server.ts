import { redirect } from '@sveltejs/kit';

export const load = async ({ parent }: { parent: () => Promise<any> }) => {
    // 부모 레이아웃에서 데이터 가져오기
    const layoutData = await parent();
    
    // 버킷이 있으면 첫 번째 버킷으로 리디렉션
    if (layoutData.buckets && layoutData.buckets.length > 0) {
        const firstBucket = layoutData.buckets[0];
        throw redirect(307, `/browser/${firstBucket.Name}`);
    }
    
    // 버킷이 없으면 기본 데이터 반환
    throw redirect(307, `/browser`);
};