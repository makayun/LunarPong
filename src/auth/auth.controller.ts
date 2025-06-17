import { FastifyRequest, FastifyReply } from 'fastify';
// import { hashPassword, checkPassword, sign2faToken, signAccessToken, signRefreshToken, verifyToken} from './auth.utils';
import { hashPassword, checkPassword, sign2faToken, signAccessToken, verifyToken} from './auth.utils';
import { getDB } from '../back/db';
import jwt from 'jsonwebtoken';

import { authenticator } from 'otplib';
import QRCode from 'qrcode';


interface AuthBody {
	username: string;
	password: string;
}

interface RegBody {
	username: string;
	password: string;
}

interface RefreshTokenBody {
	refreshToken: string;
}

export interface getUser {
	id: number;
	username: string;
	password: string;
	otp: string;
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

export const refresh  = async (
	request: FastifyRequest<{ Body: RefreshTokenBody }>,
	reply: FastifyReply
) => {
	const { refreshToken } = request.body;
	if (!refreshToken) {
		return reply.status(400).send({ error: 'No refresh token provided' });
	}
	try {
		const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
		// Тут можно проверить refreshToken в БД (опционально)
		const newAccessToken = signAccessToken(payload.id, payload.username);
		return reply.send({ accessToken: newAccessToken });
	} catch {
		return reply.status(401).send({ error: 'Invalid refresh token' });
	}
};

export const twofa  = async (
	request: FastifyRequest<{ Body: RefreshTokenBody }>,
	reply: FastifyReply
) => {
	const { refreshToken } = request.body;
	if (!refreshToken) {
		return reply.status(400).send({ error: 'No refresh token provided' });
	}

	try {
		const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
		// Тут можно проверить refreshToken в БД (опционально)
		const newAccessToken = signAccessToken(payload.id, payload.username);
		return reply.send({ accessToken: newAccessToken });
	} catch {
		return reply.status(401).send({ error: 'Invalid refresh token' });
	}
};
