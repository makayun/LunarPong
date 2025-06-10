// import db from '../back/db';
// import { FastifyReply, FastifyRequest } from 'fastify';
// import { hashPassword, checkPassword, signToken } from './auth.utils';

// export const register = async (req: FastifyRequest, reply: FastifyReply) => {
// 	const { username, password } = req.body as any;

// 	const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
// 	if (stmt.get(username)) {
// 		return reply.status(400).send({ error: 'User already exists' });
// 	}

// 	const hashed = hashPassword(password);
// 	db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashed);

// 	reply.send({ message: 'User registered' });
// };

// export const login = async (req: FastifyRequest, reply: FastifyReply) => {
// 	const { username, password } = req.body as any;

// 	const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
// 	if (!user || !checkPassword(password, user.password)) {
// 		return reply.status(401).send({ error: 'Invalid credentials' });
// 	}

// 	const token = signToken(username);
// 	reply.send({ token });
// };

import { FastifyRequest, FastifyReply } from 'fastify';
import { hashPassword, checkPassword, signAccessToken, signRefreshToken} from './auth.utils';
import db from '../back/db';
import jwt from 'jsonwebtoken';

interface AuthBody {
	username: string;
	password: string;
}

interface RefreshTokenBody {
	refreshToken: string;
}

interface User {
	id: number;
	username: string;
	password: string;
}

export const login = async (
		request: FastifyRequest<{ Body: AuthBody }>,
		reply: FastifyReply
	) => {
		const { username, password } = request.body;

		const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
		const user = stmt.get(username) as User | undefined;

		if (!user || !checkPassword(password, user.password)) {
			return reply.status(401).send({ error: 'Invalid credentials' });
		}

		const accessToken = signAccessToken(username);
		const refreshToken = signRefreshToken(username);
		return reply.send ({ accessToken: accessToken, refreshToken: refreshToken });
	};

export const register = async (
		request: FastifyRequest<{ Body: AuthBody }>,
		reply: FastifyReply
	) => {
		const { username, password } = request.body;

		const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
		if (stmt.get(username)) {
			return reply.status(400).send({ error: 'User already exists' });
		}

		const hashed = hashPassword(password);
		db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashed);

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

			const newAccessToken = signAccessToken(payload.username);
			return { accessToken: newAccessToken };
		} catch {
			return reply.status(401).send({ error: 'Invalid refresh token' });
		}
	};

// import db from '../back/db';
// import { FastifyReply, FastifyRequest } from 'fastify';
// import { hashPassword, checkPassword, signToken } from './auth.utils';

// interface AuthBody {
// 	username: string;
// 	password: string;
// }

// export const register = async (req: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) => {
// 	const { username, password } = req.body;

// 	const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
// 	if (stmt.get(username)) {
// 		return reply.status(400).send({ error: 'User already exists' });
// 	}

// 	const hashed = hashPassword(password);
// 	db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashed);

// 	reply.send({ message: 'User registered' });
// };

// export const login = async (req: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) => {
// 	const { username, password } = req.body;

// 	const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
// 	if (!user || !checkPassword(password, user.password)) {
// 		return reply.status(401).send({ error: 'Invalid credentials' });
// 	}

// 	const token = signToken(username);
// 	reply.send({ token });
// };
