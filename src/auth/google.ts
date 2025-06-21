import { getDB } from '../back/db';
import { getUser } from './auth.controller'
import { signRefreshToken } from './auth.utils';
import { FastifyRequest, FastifyReply } from 'fastify';

const simpleOauth2 = require('simple-oauth2');
const { AuthorizationCode } = simpleOauth2;
const { serialize } = require('@fastify/cookie')

export const g_check_user = (userInfo: any) => {
	console.log(`[db] start check G user;`);
	const db = getDB();
	const stmt = db.prepare("SELECT * FROM users WHERE g_id = ?");
	console.log("[db] Running query for g_id =", userInfo.id);
	let user = stmt.get(userInfo.id) as getUser | undefined;
	console.log(`[db] user = `, user);
	if (!user) {
		console.log(`[db] user isn't exist`);
		try {
			db.prepare(`INSERT INTO users (username, g_id, g_username) VALUES (?, ?, ?)`).run(
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
		user = stmt.get(userInfo.id) as getUser | undefined;
		console.log(`[db] user = `, user);
	}
	const refreshToken = signRefreshToken(user!.id, user!.username);
	// const payload = verifyToken(refreshToken);
	return ({ refreshToken: refreshToken, id: user!.id });
}

const client = new AuthorizationCode({
	client: {
		id: process.env.GOOGLE_CLIENT_ID!,
		secret: process.env.GOOGLE_CLIENT_SECRET!,
	},
	auth: {
		tokenHost: 'https://oauth2.googleapis.com',
		authorizePath: 'https://accounts.google.com/o/oauth2/v2/auth',
		tokenPath: '/token',
	},
});

const authorizationUri = client.authorizeURL({
	redirect_uri: process.env.GOOGLE_REDIRECT_URI,
	scope: ['profile', 'email'],
	state: process.env.GOOGLE_STATE_CODE, // используйте для защиты от CSRF
});

export const g_auth = async (_: FastifyRequest, reply: FastifyReply) => {
	console.log("[authorizationUri]", authorizationUri);
	// перенаправляем пользователя на страницу авторизации Google
	return reply.redirect(authorizationUri);
};


export const g_auth_cb = async (req: FastifyRequest, reply: FastifyReply) => {
	const { code } = req.query as { code: string };

	const options = {
		code,
		redirect_uri: process.env.GOOGLE_REDIRECT_URI,
	};

	try {
		const accessToken = await client.getToken(options);
		const token = accessToken.token;

		// теперь можно использовать токен, например получить данные пользователя:
		const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: {
				Authorization: `Bearer ${token.access_token}`,
			},
		});
		const userInfo = await res.json();
		console.log('User info:', userInfo);
		
		const user = g_check_user(userInfo) as any;
		console.log(`[google] after db user `, user);

		if (!user)
			reply.status(500).send({ error: "???" });

		const cookie = serialize('refreshToken', user.refreshToken, {
			path: '/',
			httpOnly: false, // <- для чтения из браузера JS (если хочешь скрыть, ставь true)
			sameSite: 'Lax', // 'Lax' или 'Strict' для защиты от CSRF
			secure: true,
    		maxAge: 30,
  		})

		reply.header('Set-Cookie', cookie)

		reply.redirect(`/`);
	} catch (error) {
		console.error('Access Token Error', error);
		return reply.status(500).send('Authentication failed');
	}

	// const token = await server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

	// // console.log(`[google] token = ${token.token.access_token}`);

	// const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
	// 	headers: { Authorization: `Bearer ${token.token.access_token}` },
	// });

	// if (!userInfoRes.ok) {
	// 	const errorData = await userInfoRes.json();
	// 	console.error("[login] Login check failed:", errorData.error);
	// 	reply.status(400).send({ error: errorData.error });
	// 	return;
	// }
	// const userInfo = await userInfoRes.json();
	// console.log(`[google] userInfo.name = ${userInfo.name}`);
	// // console.log(`[google] userInfo.id = ${userInfo.id}`);
	// const user = await g_check_user(userInfo) as any;
	// // console.log(`[google] after db user `, user);

	// if (!user)
	// 	reply.status(500).send({ error: "???" });

	// // https://localhost:12800/#game?user=
	// // %7B%22refreshToken%22%3A%22eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidXNlcm5hbWUiOiJLb25zdGFudGluIFNvcm9rb2xpdCIsImlhdCI6MTc1MDQyNzc2OSwiZXhwIjoxNzUxMDMyNTY5fQ.TlKYw0NV-lCPb7-G643b4YO8B1iYTTObqHe-4fvlngo%22%2C%22
	// // user%22%3A%7B%22id%22%3A4%2C%22username%22%3A%22Konstantin%20Sorokolit%22%2C%22iat%22%3A1750427769%2C%22exp%22%3A1751032569%7D%7D

	// const userEncoded = encodeURIComponent(JSON.stringify(user));
	// reply.redirect(`/#game?user=${userEncoded}`);
};