import type { WebSocket } from "@fastify/websocket";

export default class UserSession {
	public user: number;
	public socket_g?: WebSocket;
	public socket_c?: WebSocket;

	constructor(user: number, socket_g?: WebSocket | undefined, socket_c?: WebSocket | undefined) {
		this.user = user;
		this.setSocketG(socket_g);
		this.setSocketC(socket_c);
	}

	getUser(): number {
		return this.user;
	}

	setSocketG(socket?: WebSocket | undefined): void {
		this.socket_g = socket;
		if (this.socket_g) {
			this.socket_g.isAlive = true;
		}
	}

	setSocketC(socket?: WebSocket | undefined): void {
		this.socket_c = socket;
		if (this.socket_c) {
			this.socket_c.isAlive = true;
		}
	}
}