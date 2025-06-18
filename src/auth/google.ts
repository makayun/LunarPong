import { getDB } from '../back/db';
import { getUser } from './auth.controller'
import { signRefreshToken, verifyToken } from './auth.utils';

export const g_check_user = (userInfo: any) => async () => {
	const db = getDB();
	let user = await db.get('SELECT * FROM users WHERE g_id = ?', userInfo.id) as getUser | undefined;
	if (!user) {
		try {
			await db.run(
				`INSERT INTO users (username, g_id, g_username) VALUES (?, ?, ?)`,
				userInfo.username,
				userInfo.id,
				userInfo.username
			);
		} catch (err) {
			console.error("Failed to insert user:", err);
			// You can re-throw or handle the error as needed
			// throw err;
			return undefined;
		}
		user = await db.get('SELECT * FROM users WHERE g_id = ?', userInfo.id) as getUser | undefined;
	}
	const refreshToken = signRefreshToken(user!.id, user!.username);
	const payload = verifyToken(refreshToken);
	return ({ refreshToken: refreshToken, user: payload });
}