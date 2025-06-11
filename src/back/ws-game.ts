import type { FastifyInstance }	from "fastify";
import type { FastifyRequest }	from "fastify";
import type { WebSocket }		from "@fastify/websocket";

import { PongBackEngine }	from "../scenes/PongBackScene";
import { PongBackScene }	from "../scenes/PongBackScene";
import { PADDLE_STEP }				from "../defines/constants";
import { animatePaddleToX } from "./paddleMovement";
import type { InitGameRequest, WSMessage, User, InitGameSuccess, PlayerSide, GameType, GUID } from "../defines/types";
import { AIOpponent } from "./aiOpponent";
import { error } from "node:console";

export interface WsGamePluginOptions { engine: PongBackEngine; users: User[] };

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
				case "PlayerInput":
					let scene = engine.scenes.find(scene => scene.id === msg.gameId);
					if (scene) {
						const paddle = msg.side === "left" ? scene.pongMeshes.paddleLeft : scene.pongMeshes.paddleRight;
						scene.stopAnimation(paddle);
						animatePaddleToX(paddle, paddle.position.z + PADDLE_STEP * msg.direction);
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

async function processInitGameRequest(engine: PongBackEngine, socket: WebSocket, msg: InitGameRequest): Promise<void> {
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

	switch (msg.gameType) {
		case "Local game":
			return await createLocalGame(engine, msg.user, socket);
		case "Remote game":
			return await createRemoteGame(engine, msg.user, socket);
		case "Versus AI":
			return await createAiGame(engine, msg.user, socket);
	}
}

async function createLocalGame(engine: PongBackEngine, player: User, socket: WebSocket) : Promise<void> {
	const game = new PongBackScene(engine);
	addPlayerToGame(game, player, socket);
	await game.enablePongPhysics();
	sendInitGameSuccess("Local game", game.id, assignSide(game), socket);
}

async function createRemoteGame(engine: PongBackEngine, newPlayer: User, socket: WebSocket) : Promise<void> {
	let game = engine.scenes.find(scene => scene.players.length === 1 && scene.state === "init");
	if (game) {
		addPlayerToGame(game, newPlayer, socket);
		await game.enablePongPhysics();
	}
	else {
		game = new PongBackScene(engine);
		addPlayerToGame(game, newPlayer, socket);
	}
	sendInitGameSuccess("Remote game", game.id, assignSide(game), socket);
}

async function createAiGame(engine: PongBackEngine, newPlayer: User, socket: WebSocket) : Promise<void> {
	const game = new PongBackScene(engine);
	addPlayerToGame(game, newPlayer, socket);
	addAiOpponent(game);
	await game.enablePongPhysics();
	sendInitGameSuccess("Versus AI", game.id, "left", socket);
}

function addPlayerToGame(game: PongBackScene, newPlayer: User, socket: WebSocket) : void {
	if (!game.players.find(player => player.id === newPlayer.id)) {
		newPlayer.gameSocket = socket;
		game.players.push(newPlayer);
	}
}

function assignSide(game: PongBackScene) : PlayerSide {
	if (game.players.length === 1)
		return "left";
	else if (game.players.length === 2)
		return "right";
	else
		throw error("Invalid number of players!");
}

function addAiOpponent(game: PongBackScene) : void {
	if (!game.aiOpponent)
		game.aiOpponent = new AIOpponent(game, "right");
}

function sendInitGameSuccess(inGameType: GameType, inGameId: GUID, inPlayerSide: PlayerSide, socket: WebSocket) {
	const response : InitGameSuccess = {
		type: "InitGameSuccess",
		gameType: inGameType,
		gameId: inGameId,
		gameState: "init",
		playerSide: inPlayerSide
	}

	socket.send(JSON.stringify(response));
}
