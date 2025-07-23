import type { WebSocket  } from "@fastify/websocket";

export default class Session {
	public id: number;
	public socket: WebSocket;

	constructor(user: number, socket: WebSocket) {
		this.id = user;
		this.socket = socket;
	}

	getID(): number {
		return this.id;
	}
}