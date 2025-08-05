import { getDB } from '../back/db';
import { getUser } from './auth.controller'
import { signRefreshToken } from './auth.utils';
import { FastifyRequest, FastifyReply } from 'fastify';
// import { writeFileSync } from 'fs';

const simpleOauth2 = require('simple-oauth2');
const { AuthorizationCode } = simpleOauth2;
const { serialize } = require('@fastify/cookie')

export const ft_check_user = (userInfo: any) => {
	console.log(`[db] start check FT user;`);
	try {
		const db = getDB();
		const stmt = db.prepare("SELECT * FROM users WHERE ft_id = ?");
		console.log("[db] Running query for ft_id =", userInfo.id);
		let user = stmt.get(userInfo.id) as getUser | undefined;
		console.log(`[db] user = `, user);
		if (!user) {
			console.log(`[db] user isn't exist`);
			db.prepare(`INSERT INTO users (username, ft_id, ft_username) VALUES (?, ?, ?)`).run(
				userInfo.displayname,
				userInfo.id,
				userInfo.displayname
			);
			console.log(`[db.run] insert - OK`);
			user = stmt.get(userInfo.id) as getUser | undefined;
			console.log(`[db] user = `, user);
		}
		const refreshToken = signRefreshToken(user!.id, user!.username);
		// const payload = verifyToken(refreshToken);
		return ({ refreshToken: refreshToken, id: user!.id });
	} catch (err: any) {
		console.error("ft_check_user:", err);
		// You can re-throw or handle the error as needed
		// throw err;
		return undefined;
	}
}

function getFTOAuthClient() {
	if (!process.env.FT_UID || !process.env.FT_SECRET || !process.env.FT_REDIRECT_URI) {
		throw new Error('FT env vars not loaded');
	}

	return new AuthorizationCode({
		client: {
			id: process.env.FT_UID,
			secret: process.env.FT_SECRET,
		},
		auth: {
			tokenHost: process.env.FT_REDIRECT_URI,
			authorizePath: 'https://api.intra.42.fr/oauth/authorize'
		},
	});
}

export const ft_auth = async (_: FastifyRequest, reply: FastifyReply) => {
	try {
		const client = getFTOAuthClient();
		const authorizationUri = client.authorizeURL({
			redirect_uri: process.env.FT_REDIRECT_URI,
			scope: ['public'],
		});
		console.log("[authorizationUri]", authorizationUri);
		return reply.redirect(authorizationUri);
	} catch (err: any) {
		console.error("[authorizationUri]", err);
		return reply
			.code(500)
			.send({ error: "Failed to generate authorization URL" });
	}
};

async function getAccessToken(code: string) {
	const tokenParams = {
		code,
		redirect_uri: process.env.FT_REDIRECT_URI,
		scope: 'public',
	};

	const client = new AuthorizationCode({
	client: {
		id: process.env.FT_UID,
		secret: process.env.FT_SECRET,
	},
	auth: {
		tokenHost: process.env.FT_REDIRECT_URI,
		authorizePath: 'https://api.intra.42.fr/oauth/authorize',
		tokenPath: 'https://api.intra.42.fr/oauth/token',
		},
	});
	try {
		const accessToken = await client.getToken(tokenParams);
		console.log('Token received:', accessToken.token);

		// accessToken.token содержит:
		// {
		//   access_token: '...',
		//   token_type: 'bearer',
		//   expires_in: 7200,
		//   refresh_token: '...'
		// }
		return accessToken.token;
	} catch (err: any) {
		console.error('Access Token Error', err);
	}
}

export const ft_auth_cb = async (req: FastifyRequest, reply: FastifyReply) => {
	const { code } = req.query as { code: string };
	console.log('Code:', code);
	if (!code) {
		return reply.redirect(`/`);
		// return reply.status(400).send({ error: 'Code is required' });
	}

	const token = await getAccessToken(code as string);
	if (!token) {
		// return reply.redirect(`/`);
		return reply.status(500).send({ error: 'Failed to obtain access token' });
	}

	try {
		const res = await fetch('https://api.intra.42.fr/v2/me?fields=id,login', {
			headers: {
				Authorization: `Bearer ${token.access_token}`,
			},
		});
		const userInfo = await res.json();
		// writeFileSync('user_data.json', JSON.stringify(userInfo, null, 2), 'utf8'); // удалить после отладки
		console.log('User info id:', userInfo.id, 'displayname:', userInfo.displayname);

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
	} catch (err: any) {
		console.error('Access Token Error', err);
		return reply.status(500).send('Authentication failed');
	}
};
