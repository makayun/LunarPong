import { FastifyRequest, FastifyReply } from 'fastify';
// import { hashPassword, checkPassword, sign2faToken, signAccessToken, signRefreshToken, verifyToken} from './auth.utils';
import { hashPassword, checkPassword, sign2faToken, verifyToken} from './auth.utils';
import { getDB } from '../back/db';

import { authenticator } from 'otplib';
import QRCode from 'qrcode';

import { FastifyInstance } from "fastify";

import { g_check_user } from "./google";


interface AuthBody {
	username: string;
	password: string;
}

interface RegBody {
	username: string;
	password: string;
}

export interface getUser {
	id: number;
	username: string;
	password: string;
	otp: string;
	g_id: number;
	g_username: string;
}

export const login = async (
	request: FastifyRequest<{ Body: AuthBody }>,
	reply: FastifyReply
) => {
	const { username, password } = request.body;
	const user = await getDB().get('SELECT * FROM users WHERE username = ?', username) as getUser | undefined;
	if (!user || !checkPassword(password, user.password)) {
		return reply.status(401).send({ error: 'Invalid credentials' });
	}

	/*
	const secret = authenticator.generateSecret(); //IQAQSETQBZFDKFZ2

	const otpauth = authenticator.keyuri(username, "Pong", secret);
	const qr = await QRCode.toDataURL(otpauth);
		return reply.send ({ qr: qr });
	*/

	const twofaToken = sign2faToken(user.id, username);
	// const refreshToken = signRefreshToken(user.id, username);
	const payload = verifyToken(twofaToken);
	return reply.send ({ twofaToken: twofaToken, user: payload });
};

export const register = async (
	request: FastifyRequest<{ Body: RegBody }>,
	reply: FastifyReply
) => {
	const { username, password } = request.body;
	const user = await getDB().get('SELECT * FROM users WHERE username = ?', username) as getUser | undefined;
	if (user !== undefined) {
		return reply.status(400).send({ error: 'User already exists' });
	}
	const hashed = hashPassword(password);
	const secret = authenticator.generateSecret();
	const otpauth = authenticator.keyuri(username, "Pong", secret);
	const qr = await QRCode.toDataURL(otpauth);

	await getDB().run('INSERT INTO users (username, password, otp) VALUES (?, ?, ?)', username, hashed, secret);
	return reply.send ({ qr: qr});
	return reply.send({ message: 'User registered' });
};

// export const refresh  = async (
// 	request: FastifyRequest<{ Body: RefreshTokenBody }>,
// 	reply: FastifyReply
// ) => {
// 	const { refreshToken } = request.body;
// 	if (!refreshToken) {
// 		return reply.status(400).send({ error: 'No refresh token provided' });
// 	}
// 	try {
// 		const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
// 		// Тут можно проверить refreshToken в БД (опционально)
// 		const newAccessToken = signAccessToken(payload.id, payload.username);
// 		return reply.send({ accessToken: newAccessToken });
// 	} catch {
// 		return reply.status(401).send({ error: 'Invalid refresh token' });
// 	}
// };

// export const twofa  = async (
// 	request: FastifyRequest<{ Body: RefreshTokenBody }>,
// 	reply: FastifyReply
// ) => {
// 	const { refreshToken } = request.body;
// 	if (!refreshToken) {
// 		return reply.status(400).send({ error: 'No refresh token provided' });
// 	}

// 	try {
// 		const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
// 		// Тут можно проверить refreshToken в БД (опционально)
// 		const newAccessToken = signAccessToken(payload.id, payload.username);
// 		return reply.send({ accessToken: newAccessToken });
// 	} catch {
// 		return reply.status(401).send({ error: 'Invalid refresh token' });
// 	}
// };

export const g_auth = (server: FastifyInstance) => async (req: FastifyRequest, reply: FastifyReply) => {
	const token = await server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

	// console.log(`[google] token = ${token.token.access_token}`);

	const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
		headers: { Authorization: `Bearer ${token.token.access_token}` },

	});
	if (!userInfoRes.ok) {
		const errorData = await userInfoRes.json();
		console.error("[login] Login check failed:", errorData.error);
		reply.status(400).send({ error: errorData.error });
		return;
	}
	const userInfo = await userInfoRes.json();
	console.log(`[google] userInfo.name = ${userInfo.name}`);
	const user = g_check_user(userInfo) as any;
	// e.g. { id, email, name, picture }

	// Create session or JWT:
	// const jwt = fastify.jwt.sign({ id: userInfo.id, email: userInfo.email });

	if (!user)
		reply.status(500).send({ error: "???" });
	reply.send({ user: userInfo });
};