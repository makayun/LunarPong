// plugins/googleAuth.ts
import fastifyPlugin from "fastify-plugin";
import fastifyOauth2 from "@fastify/oauth2";

export default fastifyPlugin(async (fastify) => {
	fastify.register(fastifyOauth2, {
		name: "googleOAuth2",
		scope: ["profile", "email"],
		credentials: {
			client: {
				id: process.env.GOOGLE_CLIENT_ID!,
				secret: process.env.GOOGLE_CLIENT_SECRET!,
			},
			auth: fastifyOauth2.GOOGLE_CONFIGURATION,
		},
		startRedirectPath: "/api/auth/google",
		callbackUri: process.env.GOOGLE_REDIRECT_URI!,
	});
});
