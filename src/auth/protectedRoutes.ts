import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import authHook from './auth.hook';
import { getUser } from './auth.controller'
import { getDB } from '../back/db';
import { authenticator } from 'otplib';
import { signAccessToken, signRefreshToken, verifyToken} from './auth.utils';
import jwt from 'jsonwebtoken';
// import QRCode from 'qrcode';

interface twofaBody {
	id: number;
	token: string;
}

interface refreshBody {
	token: string;
}

export default async function protectedRoutes(fastify: FastifyInstance) {
	// Навешиваем хук авторизации на все маршруты
	fastify.addHook('preHandler', authHook);

	// Пример защищённого GET-запроса
	fastify.get('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
		// request.user был установлен в authHook
		return reply.send({ user: request.user });
	});

	fastify.post('/refresh', {
		schema: {
			body: {
				type: 'object',
				properties: {
					token: {type: 'string'}
				},
				required: ['token']
			}
		}
	}, async (request: FastifyRequest, reply: FastifyReply) => {
		const { token } = request.body as refreshBody;
		if (!token) {
			return reply.status(400).send({ error: 'No refresh token provided' });
		}
		try {
			const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
			// Тут можно проверить refreshToken в БД (опционально)
			const newAccessToken = signAccessToken(payload.id, payload.username);
			return reply.send({ accessToken: newAccessToken, user: payload });
		} catch {
			return reply.status(401).send({ error: 'Invalid refresh token' });
		}
	});	

	fastify.post('/2fa', {
		schema: {
			body: {
				type: 'object',
				properties: {
					id: {type: 'string'},
					token: {type: 'string'}
				},
				required: ['id', 'token']
			}
		}
	}, async (request: FastifyRequest, reply: FastifyReply) => {
		const { id, token } = request.body as twofaBody;
		console.log(`[2fa] Request id = ${id}, token = ${token}`);
		const user = await getDB().get('SELECT * FROM users WHERE id = ?', id) as getUser | undefined;
		console.log(`[2fa] DB id = ${user!.id}, opt = ${user!.otp}`);
		if (user == undefined) {
			return reply.status(400).send({ error: 'Wrong request' });
		}
		
		// const secret = authenticator.generateSecret();
		// const otpauth = authenticator.keyuri(user!.username, "Pong", secret);
		// const qr = await QRCode.toDataURL(otpauth);
		// console.log(`[2fa] SECRET = ${secret}`);
		// console.log(`[2fa] SECRET (QR)  = ${qr}`);
		
		const isValid = authenticator.check(token, user!.otp);
		if (!isValid) {
			return reply.status(401).send({ error: 'Wrong request' });
		}

		const accessToken = signAccessToken(user!.id, user!.username);
		const refreshToken = signRefreshToken(user!.id, user!.username);
		const payload = verifyToken(accessToken);
		return reply.send ({ accessToken: accessToken, refreshToken: refreshToken, user: payload });
	});

	fastify.post('/settings', {
		schema: {
			body: {
				type: 'object',
				properties: {
					email: { type: 'string', format: 'email' },
					notifications: { type: 'boolean' }
				},
				required: ['email']
			}
		}
	}, async (request: FastifyRequest, reply: FastifyReply) => {
		return reply.send({ updated: true, user: request.user.username });
	});
}
