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
	// console.log(`[google] userInfo.id = ${userInfo.id}`);
	const user = await g_check_user(userInfo) as any;
	// console.log(`[google] after db user `, user);

	if (!user)
		reply.status(500).send({ error: "???" });

	// https://localhost:12800/#game?user=
	// %7B%22refreshToken%22%3A%22eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidXNlcm5hbWUiOiJLb25zdGFudGluIFNvcm9rb2xpdCIsImlhdCI6MTc1MDQyNzc2OSwiZXhwIjoxNzUxMDMyNTY5fQ.TlKYw0NV-lCPb7-G643b4YO8B1iYTTObqHe-4fvlngo%22%2C%22
	// user%22%3A%7B%22id%22%3A4%2C%22username%22%3A%22Konstantin%20Sorokolit%22%2C%22iat%22%3A1750427769%2C%22exp%22%3A1751032569%7D%7D

	const userEncoded = encodeURIComponent(JSON.stringify(user));
	reply.redirect(`/#game?user=${userEncoded}`);
};