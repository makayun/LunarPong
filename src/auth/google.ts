import { getDB } from '../back/db';
import { getUser } from './auth.controller'
import { signRefreshToken } from './auth.utils';
import { FastifyRequest, FastifyReply } from 'fastify';

const simpleOauth2 = require('simple-oauth2');
const { AuthorizationCode } = simpleOauth2;
const { serialize } = require('@fastify/cookie')

export const g_check_user = (userInfo: any) => {
	console.log(`[db] start check G user;`);
	try {
		const db = getDB();
		const stmt = db.prepare("SELECT * FROM users WHERE g_id = ?");
		console.log("[db] Running query for g_id =", userInfo.id);
		let user = stmt.get(userInfo.id) as getUser | undefined;
		console.log(`[db] user = `, user);
		if (!user) {
			console.log(`[db] user isn't exist`);
			db.prepare(`INSERT INTO users (username, g_id, g_username) VALUES (?, ?, ?)`).run(
				userInfo.name,
				userInfo.id,
				userInfo.name
			);
			console.log(`[db.run] insert - OK`);
			user = stmt.get(userInfo.id) as getUser | undefined;
			console.log(`[db] user = `, user);
		}
		const refreshToken = signRefreshToken(user!.id, user!.username);
		// const payload = verifyToken(refreshToken);
		return ({ refreshToken: refreshToken, id: user!.id });
	} catch (err: any) {
		console.error("g_check_user:", err);
		// You can re-throw or handle the error as needed
		// throw err;
		return undefined;
	}
}

function getGoogleOAuthClient() {
	if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
		throw new Error('Google OAuth env vars not loaded');
	}

	return new AuthorizationCode({
		client: {
			id: process.env.GOOGLE_CLIENT_ID,
			secret: process.env.GOOGLE_CLIENT_SECRET,
		},
		auth: {
			tokenHost: 'https://oauth2.googleapis.com',
			authorizePath: 'https://accounts.google.com/o/oauth2/v2/auth',
			tokenPath: '/token',
		},
	});
}

// const client = new AuthorizationCode({
// 	client: {
// 		id: process.env.GOOGLE_CLIENT_ID!,
// 		secret: process.env.GOOGLE_CLIENT_SECRET!,
// 	},
// 	auth: {
// 		tokenHost: 'https://oauth2.googleapis.com',
// 		authorizePath: 'https://accounts.google.com/o/oauth2/v2/auth',
// 		tokenPath: '/token',
// 	},
// });

// const authorizationUri = client.authorizeURL({
// 	redirect_uri: process.env.GOOGLE_REDIRECT_URI,
// 	scope: ['profile', 'email'],
// 	state: process.env.GOOGLE_STATE_CODE, // используйте для защиты от CSRF
// });

export const g_auth = async (_: FastifyRequest, reply: FastifyReply) => {
	const client = getGoogleOAuthClient();
	const authorizationUri = client.authorizeURL({
		redirect_uri: process.env.GOOGLE_REDIRECT_URI,
		scope: ['profile', 'email'],
		state: process.env.GOOGLE_STATE_CODE,
	});
	console.log("[authorizationUri]", authorizationUri);
	return reply.redirect(authorizationUri);
};

export const g_auth_cb = async (req: FastifyRequest, reply: FastifyReply) => {
	const client = getGoogleOAuthClient();
	const { code } = req.query as { code: string };

	console.log('Code:', code);
	if (!code) {
		return reply.redirect(`/`);
		// return reply.status(400).send({ error: 'Code is required' });
	}

	const options = {
		code,
		redirect_uri: process.env.GOOGLE_REDIRECT_URI,
	};

	try {
		const accessToken = await client.getToken(options);
		const token = accessToken.token;

		const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: {
				Authorization: `Bearer ${token.access_token}`,
			},
		});
		const userInfo = await res.json();
		console.log('User info:', userInfo);

		const user = g_check_user(userInfo) as any;

		if (!user) return reply.status(500).send({ error: "???" });

		const cookie = serialize('refreshToken', user.refreshToken, {
			path: '/',
			httpOnly: false,
			sameSite: 'Lax',
			secure: true,
			maxAge: 30,
		});

		reply.header('Set-Cookie', cookie);
		reply.redirect(`/`);
	} catch (err: any) {
		console.error('Access Token Error', err);
		return reply.status(500).send('Authentication failed');
	}
};
