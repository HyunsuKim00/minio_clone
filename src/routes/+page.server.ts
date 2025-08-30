import { redirect } from '@sveltejs/kit';

export const load = async () => {
    // 바로 브라우저 페이지로 리디렉션
    throw redirect(307, `/browser`);
};