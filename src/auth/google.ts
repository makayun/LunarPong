import { getDB } from '../back/db';
import { getUser } from './auth.controller'
import { signRefreshToken, verifyToken } from './auth.utils';

export const g_check_user = async (userInfo: any) => {
	console.log(`[db] start check G user;`);
	const db = getDB();
	const stmt = await db.prepare("SELECT * FROM users WHERE g_id = ?");
	console.log("[db] Running query for g_id =", userInfo.id);
	let user = await stmt.get(userInfo.id) as getUser | undefined;
	console.log(`[db] user = `, user);
	if (!user) {
		console.log(`[db] user isn't exist`);
		try {
			await db.run(
				`INSERT INTO users (username, g_id, g_username) VALUES (?, ?, ?)`,
				userInfo.name,
				userInfo.id,
				userInfo.name
			);
			console.log(`[db.run] insert - OK`);
		} catch (err) {
			console.error("Failed to insert user:", err);
			// You can re-throw or handle the error as needed
			// throw err;
			return undefined;
		}
		user = await stmt.get(userInfo.id) as getUser | undefined;
		console.log(`[db] user = `, user);
	}
	const refreshToken = signRefreshToken(user!.id, user!.username);
	const payload = verifyToken(refreshToken);
	return ({ refreshToken: refreshToken, user: payload });
}