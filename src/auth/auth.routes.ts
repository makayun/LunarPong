import { FastifyInstance } from 'fastify';
import { login, register, g_auth} from './auth.controller';

export default async function (fastify: FastifyInstance) {
	fastify.post('/api/register', register);
	fastify.post('/api/login', login);
	fastify.get("/api/auth/google/callback", g_auth(fastify));
}
