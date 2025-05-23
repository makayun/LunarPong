import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import type { FastifyRequest } from "fastify";

import type { InitMessage, WSMessage, User, Game } from "../defines/types";
import { generateGuid } from "../helpers/helpers";

export interface WsGamePluginOptions {
	users: User[];
	games: Game[];
}

export async function wsGamePlugin(server: FastifyInstance, options: WsGamePluginOptions) {
	const { users, games } = options;

	server.get("/ws-game", { websocket: true }, (socket: WebSocket, _req: FastifyRequest) => {
		console.log("WebSocket game client connected");

		socket.on("message", (message: string) => {
		try {
			const msg: WSMessage = JSON.parse(message);

			switch (msg.type) {
			case "WsInit":
				processWsInit(users, games, socket, msg as InitMessage);
				break;
			default:
				console.error(`Bad WS message type: ${msg.type}`);
				socket.send(`Bad WS message type: ${msg.type}`);
			}
		}
		catch (e) {
			console.error(e, message);
		}
	});
	});
}

function processWsInit(users: User[], games: Game[], socket: WebSocket, msg: InitMessage): void {
	console.log("Initializing game for:", msg.user.id);

	if (users.find(user => user.id === msg.user.id || user.socket === socket)) {
		console.error(`User ${msg.user.id} is already playing!`);
		return;
	}

	const newUser: User = { id: msg.user.id, socket };
	users.push(newUser);

	let newGame = games.find(game => game.state === "init" && game.players.length === 1);
	if (!newGame) {
		newGame = {
			id: generateGuid(),
			state: "init",
			players: [newUser]
		};
		games.push(newGame);
	} else {
	newGame.players.push(newUser);
	}

	newUser.gameId = newGame.id;
	socket.send(JSON.stringify({ type: "game-initialized", status: "ok" }));
}
