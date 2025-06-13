import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import authHook from './auth.hook';

export default async function protectedRoutes(fastify: FastifyInstance) {
	// Навешиваем хук авторизации на все маршруты
	fastify.addHook('preHandler', authHook);

	// Пример защищённого GET-запроса
	fastify.get('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
		// request.user был установлен в authHook
		return reply.send({ user: request.user });
	});

	// Пример защищённого POST-запроса с валидацией
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
