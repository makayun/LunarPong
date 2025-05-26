import type { FastifyInstance }	from "fastify";
import type { WebSocket }		from "@fastify/websocket";
import type { FastifyRequest }	from "fastify";

import { PongBackEngine }	from "../scenes/PongBackScene";
import { PongBackScene }	from "../scenes/PongBackScene";
import type { InitGameRequest, WSMessage, User, InitGameSuccess } from "../defines/types";

export interface WsGamePluginOptions { engine: PongBackEngine; }

export async function wsGamePlugin(server: FastifyInstance, options: WsGamePluginOptions) {
	const { engine } = options;

	server.get("/ws-game", { websocket: true }, (socket: WebSocket, _req: FastifyRequest) => {
		console.log("WebSocket game client connected");

		socket.on("message", (message: string) => {
			try {
				const msg: WSMessage = JSON.parse(message);

				switch (msg.type) {
				case "InitGameRequest":
					processInitGameRequest(engine, socket, msg as InitGameRequest);
					break;
				default:
					console.error(`Bad WS message: ${msg}`);
					socket.send(`Bad WS message: ${msg}`);
				}
			}
			catch (e) {
				socket.terminate();
				console.error(e, message);
			}
		});

		socket.on("close", () => {
			engine.removePlayerBySocket(socket);
			engine.removeEmptyScenes();
		});
	});
}

function processInitGameRequest(engine: PongBackEngine, socket: WebSocket, msg: InitGameRequest): void {
	console.log("Initializing game for player:", [msg.user.id]);

	engine.scenes.forEach(
		scene => scene.players.forEach(
			player => {
				if (player.id === msg.user.id || player.gameSocket === msg.user.gameSocket) {
					console.error("User", [msg.user.id], "is already playing!");
					return;
				}
			}
		)
	)

	const newUser: User = { id: msg.user.id, gameSocket: socket };

	let newGame = engine.scenes.find(
		scene => scene.state === "init" && scene.players.length === 1);
	if (!newGame) {
		newGame = new PongBackScene(engine);
		console.log("Creating new pong game, id:", [newGame.id])
	}
	newGame.players.push(newUser);

	console.log("Game:", [newGame.id], ", number of players:", newGame.players.length);
	console.log("Player IDs in this scene:", newGame.players.map(player => player.id));
	newUser.gameId = newGame.id;

	const response: InitGameSuccess = {
		type: "InitGameSuccess",
		status: "ok",
		gameId: newGame.id
	}
	socket.send(JSON.stringify(response));
}
