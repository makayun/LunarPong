import { FastifyRequest, FastifyReply } from 'fastify';
// import { hashPassword, checkPassword, sign2faToken, signAccessToken, signRefreshToken, verifyToken} from './auth.utils';
import { hashPassword, checkPassword, sign2faToken, verifyToken} from './auth.utils';
import { getDB } from '../back/db';

import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// import { AuthorizationCode } from 'simple-oauth2';

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
	ft_id: number;
	ft_username: string;
}

export const login = async (
	request: FastifyRequest<{ Body: AuthBody }>,
	reply: FastifyReply
) => {
	console.log("[login] request.body = ", request.body);
	const { username, password } = request.body;
	try {
		const user = getDB().prepare('SELECT * FROM lusers WHERE username = ?').get(username) as getUser | undefined;
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
	} catch (error) {
		console.error("[login] Error during login:", error);
		return reply.status(500).send({ error: 'Internal server error' });
	}
};

export const register = async (
	request: FastifyRequest<{ Body: RegBody }>,
	reply: FastifyReply
) => {
	const { username, password } = request.body;
	// const user = getDB().prepare('SELECT * FROM users WHERE username = ?').get(username) as getUser | undefined;
	// if (user !== undefined) {
	// 	return reply.status(400).send({ error: 'User already exists' });
	// }
	const hashed = hashPassword(password);
	const secret = authenticator.generateSecret();
	const otpauth = authenticator.keyuri(username, "Pong", secret);
	const qr = await QRCode.toDataURL(otpauth);

	try {
		getDB().prepare('INSERT INTO users (username, password, otp) VALUES (?, ?, ?)').run(username, hashed, secret);
		return reply.send ({ qr: qr});
	} catch (err: any) {
		console.error("[DB Error]", err); // log full error for debugging

		// Optionally inspect error.code or err.message
		if (err.message.includes("UNIQUE") || err.message.includes("already exists")) {
			return reply.status(406).send({ error: err.message, cli_error: 'register_username_duplicate' });
		}

		// Generic DB error
		return reply.status(500).send({ error: err.message, cli_error: 'server'});
	}	
};
