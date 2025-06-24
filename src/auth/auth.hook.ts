import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from './auth.utils';
// import dotenv from 'dotenv';

// dotenv.config();

// declare module 'fastify' {
// 	interface FastifyRequest {
// 		user?: any;
// 	}
// }

export default async function authHook(
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
			// (request as any).user = payload;
		} catch (err) {
			return reply.status(401).send({ error: 'Invalid or expired token' });
		}
	}
