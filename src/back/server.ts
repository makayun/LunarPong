import dotenv from 'dotenv';
dotenv.config();
import { loadSecretsIntoEnv }			from './vault-loader';

import fs								from "node:fs";
import path								from "node:path";
import { fastify }						from "fastify";
import { fastifyStatic }				from "@fastify/static";
import websocket						from "@fastify/websocket";
import closeWithGrace					from "close-with-grace";
import type { FastifyInstance }			from "fastify/fastify";
import type { FastifyListenOptions }	from "fastify";

import cookie							from '@fastify/cookie'

import { wsGamePlugin }			from "./ws-game";
import { wsChatPlugin }			from "./ws-chat"; // ✅ импорт чата
import { PongBackEngine }		from "../scenes/PongBackScene";
import { startRenderLoop }		from "../scenes/PongBackScene";
import type { User }			from "../defines/types";

import protectedRoutes from '../auth/protectedRoutes';
import authRoutes from '../auth/auth.routes';
// import { initRedis } from './redis-client';

async function main() {
	await loadSecretsIntoEnv("env/google");
	await loadSecretsIntoEnv("env/jwt");
	await loadSecretsIntoEnv("env/ft");

	const users: User[] = [];
	const appDir: string = fs.realpathSync(process.cwd());
	const frontDir: string = "front";
	const certPath = path.resolve(appDir, 'data/cert');

	// await initRedis(); // временно отключил, потом надо будет вернуть

	const listenOpts: FastifyListenOptions = {
		port: 12800,
		host: "0.0.0.0"
	};

	const server: FastifyInstance = fastify({
		logger: process.stdout.isTTY
			? { transport: { target: "pino-pretty" } }
			: { level: "info" },
		https: {
			key: fs.readFileSync(path.join(certPath, 'key.pem')),
			cert: fs.readFileSync(path.join(certPath, 'cert.pem')),
		}
	});

	const engine = new PongBackEngine();

	server.register(cookie);
	server.register(fastifyStatic, { root: path.resolve(appDir, frontDir) });
	server.register(websocket);
	await server.register(wsGamePlugin, { engine, users });
	await server.register(wsChatPlugin, { users });

	server.register(authRoutes);
	server.register(protectedRoutes, { prefix: '/api/protected' });
	await server.listen(listenOpts);


	startRenderLoop(engine);

	closeWithGrace(async ({ signal, err }) => {
		if (err) {
			server.log.error(err);
		} else {
			server.log.info(`${signal} received, server closing`);
		}
		engine.stopRenderLoop();
		await server.close();
	});
}

main().catch(err => {
	console.error("Failed to start server:", err);
	process.exit(1);
});
