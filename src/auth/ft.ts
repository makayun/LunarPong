import { getDB } from '../back/db';
import { getUser } from './auth.controller'
import { signRefreshToken } from './auth.utils';
import { FastifyRequest, FastifyReply } from 'fastify';

const simpleOauth2 = require('simple-oauth2');
const { AuthorizationCode } = simpleOauth2;
const { serialize } = require('@fastify/cookie')

export const ft_check_user = (userInfo: any) => {
	console.log(`[db] start check FT user;`);
	const db = getDB();
	const stmt = db.prepare("SELECT * FROM users WHERE ft_id = ?");
	console.log("[db] Running query for ft_id =", userInfo.id);
	let user = stmt.get(userInfo.id) as getUser | undefined;
	console.log(`[db] user = `, user);
	if (!user) {
		console.log(`[db] user isn't exist`);
		try {
			db.prepare(`INSERT INTO users (username, ft_id, ft_username) VALUES (?, ?, ?)`).run(
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

function getFTOAuthClient() {
	if (!process.env.FT_UID || !process.env.FT_SECRET || !process.env.FT_SECRET) {
		throw new Error('FT env vars not loaded');
	}

	return new AuthorizationCode({
		client: {
			id: process.env.FT_UID,
			secret: process.env.FT_SECRET,
		},
		auth: {
			tokenHost: 'https://api.intra.42.fr',
			authorizePath: 'https://accounts.google.com/o/oauth2/v2/auth',
			tokenPath: '/token',
		},
	});
}

export const ft_auth = async (_: FastifyRequest, reply: FastifyReply) => {
	const client = getFTOAuthClient();
	const authorizationUri = client.authorizeURL({
		redirect_uri: process.env.FT_REDIRECT_URI,
		scope: ['profile', 'email'],
	});
	console.log("[authorizationUri]", authorizationUri);
	return reply.redirect(authorizationUri);
};

export const ft_auth_cb = async (req: FastifyRequest, reply: FastifyReply) => {
	const client = getFTOAuthClient();
	const { code } = req.query as { code: string };

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

		const user = ft_check_user(userInfo) as any;

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
	} catch (error) {
		console.error('Access Token Error', error);
		return reply.status(500).send('Authentication failed');
	}
};
