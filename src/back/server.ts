import fs								from "node:fs";
import path								from "node:path";
import { fastify }						from "fastify";
import { fastifyStatic }				from "@fastify/static";
import websocket						from "@fastify/websocket";
import closeWithGrace					from "close-with-grace";
import type { FastifyInstance }			from "fastify/fastify";
import type { FastifyServerOptions }	from "fastify";
import type { FastifyListenOptions }	from "fastify";

import { wsGamePlugin }			from "./ws-game";
import { PongBackEngine }		from "../scenes/PongBackScene";



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

	const engine = new PongBackEngine();

	server.register(fastifyStatic, { root: path.resolve(appDir, frontDir) });
	server.register(websocket);
	await server.register(wsGamePlugin, { engine });

	await server.listen(listenOpts);

	engine.runRenderLoop(() => {
		// manage input
		engine.scenes.forEach(scene => scene.render());
		// send coordinates
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
