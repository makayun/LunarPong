import { FastifyInstance } from 'fastify';
import { login, register, refresh, twofa } from './auth.controller';

export default async function (fastify: FastifyInstance) {
	fastify.post('/api/register', register);
	fastify.post('/api/login', login);
	fastify.post('/api/refresh', refresh);
	fastify.post('/api/2fa', twofa);
}
