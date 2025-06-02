import type { FastifyInstance }	from "fastify";
import type { FastifyRequest }	from "fastify";
import type { WebSocket }		from "@fastify/websocket";

import { PongBackEngine }	from "../scenes/PongBackScene";
import { PongBackScene }	from "../scenes/PongBackScene";
import { STEP }				from "../defines/constants";
import { animatePaddleToX } from "./paddleMovement";
import type { InitGameRequest, WSMessage, User, InitGameSuccess, PlayerSide } from "../defines/types";

export interface WsGamePluginOptions { engine: PongBackEngine; users: User[] };

export async function wsGamePlugin(server: FastifyInstance, options: WsGamePluginOptions) {
	const { engine, users } = options;

	server.get("/ws-game", { websocket: true }, (socket: WebSocket, _req: FastifyRequest) => {
		console.log("WebSocket game client connected");

		socket.on("message", (message: string) => {
			try {
				const msg: WSMessage = JSON.parse(message);

				switch (msg.type) {
				case "InitGameRequest":
					processInitGameRequest(engine, users, socket, msg as InitGameRequest);
					break;
				case "PlayerInput":
					let scene = engine.scenes.find(scene => scene.id === msg.gameId);
					if (scene) {
						const paddle = msg.side === "left" ? scene.pongMeshes.paddleLeft : scene.pongMeshes.paddleRight;
						scene.stopAnimation(paddle);
						animatePaddleToX(paddle, paddle.position.z + STEP * msg.direction);
					}
					break;
				default:
					console.error(`Bad WS message: ${msg}`);
					// socket.send(`Bad WS message: ${msg}`);
				}
			}
			catch (e) {
				// socket.terminate();
				console.error(e, message);
			}
		});

		socket.on("close", () => {

			engine.removePlayerBySocket(socket);
			engine.removeEmptyScenes();
		});
	});
}

function processInitGameRequest(engine: PongBackEngine, users: User[], socket: WebSocket, msg: InitGameRequest): void {
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
	let side: PlayerSide;

	let newGame = engine.scenes.find(
		scene => scene.state === "init" && scene.players.length === 1);
	if (!newGame) {
		newGame = new PongBackScene(engine);
		console.log("Creating new pong game, id:", [newGame.id]);
		side = "left";
	}
	else {
		newGame.enablePongPhysics();
		side = "right";
	}
	newUser.gameId = newGame.id;
	newGame.players.push(newUser);
	users.push(newUser);

	console.log("Game:", [newGame.id], ", number of players:", newGame.players.length);
	console.log("Player IDs in this scene:", newGame.players.map(player => player.id));

	const response: InitGameSuccess = {
		type: "InitGameSuccess",
		playersSide: side,
		gameState: "running",
		gameId: newGame.id
	}
	socket.send(JSON.stringify(response));
}


