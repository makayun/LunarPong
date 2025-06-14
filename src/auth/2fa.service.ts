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

// import { authenticator } from 'otplib';
// import QRCode from 'qrcode';

// async function generate2FA(username: string, issuer = 'MyApp') {
// 	const secret = authenticator.generateSecret();

// 	const otpauth = authenticator.keyuri(username, issuer, secret);
// 	const qr = await QRCode.toDataURL(otpauth);

// 	return {
// 		secret,  // Save this securely to DB
// 		qr,      // Show to user (e.g., <img src="qr">)
// 	};
// }
