import type { FastifyInstance }	from "fastify/types/instance";
import type { WebSocket }		from "@fastify/websocket";
import type { FastifyRequest }	from "fastify/types/request";

import { generateGuid }					from "../helpers/helpers";
import type { InitMessage, WSMessage }	from "../defines/types";
import type { User, Game }				from "../defines/types";

export function registerWsGameMessages (server: FastifyInstance, users: User[], games: Game[]) : void {
	server.register(async function(server: FastifyInstance) {
		server.get("/ws-game", { websocket: true }, (socket: WebSocket, _req: FastifyRequest) => {
			console.log("WebSocket game client connected");

			socket.on("message", (message: string) => {
				let msg: WSMessage;
				try {
					msg = JSON.parse(message);


				// TODO: add a generic type validating function for all messages
					switch(msg.type) {
						case "WsInit":
							processWsInit(users, games, socket, msg as InitMessage);
							break;
						default:
							console.error(`Bad WS message: ${msg} !!!`);
							socket.send(`Bad WS message: ${msg} !!!`,)
					}
				}
				catch (e) {
					console.error("Invalid JSON:", message);
					return;
				}
			});
		});
	});
}

function processWsInit(users: User[], games: Game[], socket: WebSocket, msg: InitMessage) : void {
	console.log("Initializing game for:", msg.user);

	if (users.find(user => user.id === msg.user.id || user.socket === socket)) {
		console.error(`User ${msg.user} is alrady playing!`);
		return;
	}

	const newUser: User = { id: msg.user.id, socket: socket };
	users.push(newUser);

	let newGame: Game | undefined = games.find(game => game.state === "init" && game.players.length === 1);
	if (!newGame) {
		newGame = {
			id: generateGuid(),
			state: "init",
			players: [ newUser ]
		};
		games.push(newGame);
	}
	else {
		newGame.players.push(newUser);
	}
	newUser.gameId = newGame.id;
	socket.send(JSON.stringify({ type: "game-initialized", status: "ok" }));
}
