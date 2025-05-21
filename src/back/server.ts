import fs								from "node:fs";
import path								from "node:path";
import { fastify }						from "fastify";
import { fastifyStatic }				from "@fastify/static";
import websocket						from "@fastify/websocket";
import closeWithGrace					from "close-with-grace";
import type { FastifyInstance }			from "fastify/fastify";
import type { FastifyServerOptions }	from "fastify";
import type { FastifyListenOptions }	from "fastify";
import type { FastifyRequest }			from "fastify";
import type { FastifyReply }			from "fastify";

import { initGame }				from "./initGame";
import { generateQuickGuid }	from "../helpers/helpers";
import type { PongBackScene }	from "../scenes/PongBackScene";
import type { User, Game }		from "../defines/types";
// import type { WSMessage }		from "../defines/types";

const appDir: string = fs.realpathSync(process.cwd());
const frontDir: string = "front";

const serverOpts: FastifyServerOptions = {
	logger: { level: "info" },

};
if (process.stdout.isTTY) { serverOpts.logger = { transport: { target: "pino-pretty" }}};

const listenOpts: FastifyListenOptions = {
	port: 12800,
	host: "0.0.0.0"
}

const server: FastifyInstance = fastify(serverOpts);

server.register(fastifyStatic, { root: path.resolve(appDir, frontDir) });
server.register(websocket);
// const wss = server.websocketServer;

let users: User[] = [];
let games: Game[] = [];


server.listen(listenOpts);

server.get("/initgame", { websocket: true }, (_request: FastifyRequest, reply: FastifyReply) => {
	const newUser: User = { id: generateQuickGuid() };

	users.push(newUser);

	let newGame = games.find(game => game.state === "init" && game.players.length === 1);

	if (!newGame) {
		newGame = {
			id: generateQuickGuid(),
			state: "init",
			players: [ newUser ]
		};
		games.push(newGame);
	}
	else {
		newGame.players.push(newUser);
	}
	newUser.gameId = newGame.id;

	reply.send({ user: newUser });
});

// everything connected to the game should happen here, in this async function
(async () => {
	const pongScene: PongBackScene = await initGame();

	let lastTime = Date.now();

	pongScene.engine.runRenderLoop(() => {
		const now = Date.now();
		const deltaTime = (now - lastTime) / 1000;
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
