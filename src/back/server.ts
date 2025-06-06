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
import { wsChatPlugin }			from "./ws-chat"; // ✅ импорт чата
import { PongBackEngine }		from "../scenes/PongBackScene";
import type { User }			from "../defines/types";
import type { MeshPositions } from "../defines/types";

async function main() {
	const users: User[] = [];
	const appDir: string = fs.realpathSync(process.cwd());
	const frontDir: string = "dist/front";

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

	server.register(fastifyStatic, { root: path.resolve(appDir, frontDir)});
	server.register(websocket);
	await server.register(wsGamePlugin, { engine, users });
	await server.register(wsChatPlugin, { users });             // 💬 плагин чата

	await server.listen(listenOpts);

	engine.runRenderLoop(() => {
		engine.scenes.forEach(scene => scene.render());
		engine.scenes.forEach(scene => {
			const posMessage: MeshPositions = {
				type: "MeshPositions",
				ball: scene.pongMeshes.ball.position,
				paddleLeft: scene.pongMeshes.paddleLeft.position,
				paddleRight: scene.pongMeshes.paddleRight.position
			};
			scene.players.forEach(player =>
				player.gameSocket?.send(JSON.stringify(posMessage))
			)
		})
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
