import 'fastify';
import "@fastify/oauth2";
import { OAuth2Namespace } from "@fastify/oauth2";

declare module 'fastify' {
	interface FastifyRequest {
		user?: any;
	}
	interface FastifyInstance {
		googleOAuth2: OAuth2Namespace;
	}
}
