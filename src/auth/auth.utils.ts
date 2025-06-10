import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const hashPassword = (password: string) => bcrypt.hashSync(password, 10);
export const checkPassword = (password: string, hash: string) => bcrypt.compareSync(password, hash);
export const signToken = (username: string) => jwt.sign({ username }, process.env.JWT_SECRET!, { expiresIn: '1h' });
export const signAccessToken = (username: string) => jwt.sign({ username }, process.env.JWT_SECRET!, { expiresIn: '15m' });
export const signRefreshToken = (username: string) => jwt.sign({ username }, process.env.JWT_SECRET!, { expiresIn: '7d' });
export const verifyToken = (token: string) => jwt.verify(token, process.env.JWT_SECRET!);

import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
	interface FastifyRequest {
		user?: any;
	}
}

export async function authHook(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		const authHeader = request.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return reply.status(401).send({ error: 'Missing or invalid token' });
		}
		const token = authHeader.slice(7);
		try {
			const payload = verifyToken(token);
			request.user = payload;
		} catch (err) {
			return reply.status(401).send({ error: 'Invalid or expired token' });
		}
	}

// async function authHook(request, reply) {
// 	const authHeader = request.headers.authorization;
// 	if (!authHeader || !authHeader.startsWith('Bearer ')) {
// 		return reply.status(401).send({ error: 'Missing or invalid token' });
// 	}
// 	const token = authHeader.slice(7);
// 	try {
// 		const payload = verifyToken(token);
// 		// Добавляем данные пользователя в запрос для последующего использования
// 		request.user = payload;
// 	} catch (err) {
// 		return reply.status(401).send({ error: 'Invalid or expired token' });
// 	}
// }
