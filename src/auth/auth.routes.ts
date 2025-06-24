import { FastifyInstance } from 'fastify';
import { login, register} from './auth.controller';
import { g_auth, g_auth_cb} from './google';

export default async function (fastify: FastifyInstance) {
	fastify.post('/api/register', register);
	fastify.post('/api/login', login);
	fastify.get("/api/auth/google", g_auth);
	fastify.get("/api/auth/google/callback", g_auth_cb);
	// fastify.get("/api/auth/google/ok", g_auth_ok);
}
