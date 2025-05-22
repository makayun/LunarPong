import type { FastifyInstance }	from "fastify/types/instance";
import type { WebSocket }		from "@fastify/websocket";
import type { FastifyRequest }	from "fastify/types/request";

import type { InitMessage, PlayerInput, WSMessage }		from "../defines/types";
import type { User, Game, GUID }			from "../defines/types";

export function wsGameMessages (server: FastifyInstance, users: Record<GUID, User>, games: Record<GUID, Game>) : void {
	server.register(async function(server: FastifyInstance) {
		server.get("/ws-game", { websocket: true }, (socket: WebSocket, _req: FastifyRequest) => {
			console.log("WebSocket client connected");

			socket.on("message", (message: string) => {
				let msg: WSMessage;
				try {
					msg = JSON.parse(message);
				} catch (e) {
					console.error("Invalid JSON:", message);
					return;
				}

				switch(msg.type) {
					case "WsInit":
						const initMsg = msg as InitMessage;
						if (initMsg.user) {
							console.log("Initializing game for:", initMsg.user.id);
							const newUser: User = { id: initMsg.user.id, socket: socket };
							users[newUser.id] = newUser;
							socket.send(JSON.stringify({ type: "game-initialized", status: "ok" }));
						}
						break;
					case "PlayerInput":
						const inputMsg = msg as PlayerInput;
						if (inputMsg.user && users[inputMsg.user.id]
							&& inputMsg.game && games[inputMsg.game.id]) {

						}
						break;
					default:
						console.error(`Bad WS message: ${msg} !!!`);
						socket.send(`Bad WS message: ${msg} !!!`,)
				}
			});
		});
	});
}
