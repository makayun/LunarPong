import { FastifyInstance } from 'fastify';
import { login, register, refresh } from './auth.controller';

export default async function (fastify: FastifyInstance) {
	fastify.post('/api/register', register);
	fastify.post('/api/login', login);
	fastify.post('/api/refresh', refresh);
}
