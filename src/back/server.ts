import fs								from "node:fs";
import path								from "node:path";
import { fastify }						from "fastify";
import { fastifyStatic }				from "@fastify/static";
import closeWithGrace					from "close-with-grace";
import type { FastifyInstance }			from "fastify/fastify";
import type { FastifyServerOptions }	from "fastify";
import type { FastifyListenOptions }	from "fastify";
// import { setTimeout } from "node:timers";
// import type { FastifyRequest } from "fastify";
// import type { FastifyReply } from "fastify";

import { initGame }				from "./initGame";
import type { PongBackScene }	from "../scenes/PongBackScene";

const appDir: string = fs.realpathSync(process.cwd());
const frontDir: string = "front";

const serverOpts: FastifyServerOptions = { logger: { level: "info" } };
if (process.stdout.isTTY) { serverOpts.logger = { transport: { target: "pino-pretty" }}};

const server: FastifyInstance = fastify(serverOpts);

server.register(fastifyStatic, { root: path.resolve(appDir, frontDir)});

const listenOpts: FastifyListenOptions = {
	port: 12800,
	host: "0.0.0.0"
}
server.listen(listenOpts);

// everything connected to the game should happen here, in this async function
(async () => {
	const pongScene: PongBackScene = await initGame();

	let lastTime = Date.now();

	pongScene.engine.runRenderLoop(() => {
		const now = Date.now();
		const deltaTime = (now - lastTime) / 1000; // in seconds
		lastTime = now;

		pongScene.scene.getPhysicsEngine()?._step(deltaTime);

		// console.log(pongScene.meshes.ball.position.y);
	});
})();


closeWithGrace(async ({signal, err}) => {
	if (err)
		server.log.error(err);
	else
		server.log.info(`${signal} received, server closing`);
	await server.close();
})
