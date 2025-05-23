import fs								from "node:fs";
import path								from "node:path";
import { fastify }						from "fastify";
import { fastifyStatic }				from "@fastify/static";
import websocket						from "@fastify/websocket";
import closeWithGrace					from "close-with-grace";
import type { FastifyInstance }			from "fastify/fastify";
import type { FastifyServerOptions }	from "fastify";
import type { FastifyListenOptions }	from "fastify";

import { initGame }					from "./initGame";
import { wsGamePlugin }				from "./ws-game";
import type { PongBackScene }		from "../scenes/PongBackScene";
import type { User, Game }			from "../defines/types";

async function main() {
	const appDir: string = fs.realpathSync(process.cwd());
	const frontDir: string = "front";

	const serverOpts: FastifyServerOptions = {
		logger: process.stdout.isTTY
			? { transport: { target: "pino-pretty" } }
			: { level: "info" },
	};

	const listenOpts: FastifyListenOptions = {
		port: 12800,
		host: "0.0.0.0"
	};

	const server: FastifyInstance = fastify(serverOpts);

	server.register(fastifyStatic, { root: path.resolve(appDir, frontDir) });
	server.register(websocket);

	let users: User[] = [];
	let games: Game[] = [];

	await server.register(wsGamePlugin, { users, games });

	await server.listen(listenOpts);

	// everything connected to the game should happen here
	const pongScene: PongBackScene = await initGame();

	let lastTime = Date.now();
	pongScene.engine.runRenderLoop(() => {
		const now = Date.now();
		const deltaTime = (now - lastTime) / 1000;
		lastTime = now;

		pongScene.scene.getPhysicsEngine()?._step(deltaTime);
	});


	closeWithGrace(async ({ signal, err }) => {
		if (err) {
			server.log.error(err);
		} else {
			server.log.info(`${signal} received, server closing`);
		}
		await server.close();
	});
}

main().catch(err => {
	console.error("Failed to start server:", err);
	process.exit(1);
});
