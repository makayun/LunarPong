import { getRedis } from '../back/redis-client';

export async function set2FACode(email: string, code: string, ttlSec = 300) {
	await getRedis().set(`2fa:${email}`, code, { EX: ttlSec });
}

export async function verify2FACode(email: string, inputCode: string): Promise<boolean> {
	const key = `2fa:${email}`;
	const storedCode = await getRedis().get(key);
	if (!storedCode || storedCode !== inputCode) {
		return false;
	}
	await getRedis().del(key); // удалим после успешного использования
	return true;
}
