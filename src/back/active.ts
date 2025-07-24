import Session from "./session";
import type { WebSocket } from "@fastify/websocket";

export default class ActiveService {
	private session: Session[] = [];

	constructor() {
		;
	}

	add (user: number, socket_g: WebSocket, socket_c: WebSocket): boolean {
		if (this.isActive(user))
			return false;
		try {
			this.session.push(new Session(user, socket_g, socket_c));
			return true;
		} catch (err: any) {
			return false;
		}
	}

	isActive (user: number): boolean {
		if (this.getSession(user) != -1)
			return true;
		else
			return false;
	}

	getSession (user: number): any {
		return this.session.findIndex(s => s.user === user);
	}

	ping(session: Session) {
		try {
			if (!session.socket_g || !session.socket_c) {
				console.debug(`Session ${session.user} has no sockets or just one..`);
				// console.debug(`Session ${session.user} has no sockets, removing...`);
				// this.session = this.session.filter(s => s.user !== session.user); // remove dead session
				return;
			}
			if (session.socket_g && session.socket_c && (!session.socket_g.isAlive || !session.socket_c.isAlive)) {
				console.debug(`Session ${session.user} is not alive, removing...`);
				session.socket_g.terminate();
				session.socket_c.terminate();
				this.session = this.session.filter(s => s.user !== session.user); // remove dead session
				return;
			}

			// Reset isAlive before sending ping
			if (session.socket_g) {
				session.socket_g.isAlive = false;
				session.socket_g.ping(undefined, false, () => {
					console.debug(`Pinged socket_g ${session.user}`);
				});
			}
			if (session.socket_c) {
				session.socket_c.isAlive = false;
				session.socket_c.ping(undefined, false, () => {
					console.debug(`Pinged socket_c ${session.user}`);
				});
			}
		} catch (err: any) {
			console.error(`Failed to ping session ${session.user}:`, err);
			if (session.socket_g) session.socket_g.terminate();
			if (session.socket_c) session.socket_c.terminate();
			this.session = this.session.filter(s => s.user !== session.user);
		}
	}


	async loop () {
		while (true) {
			console.debug("Checking sessions...");
        	this.session.forEach(this.ping); 
        	await new Promise((resolve) => setTimeout(resolve, 5000)); // sleep 5s
		}
	}
}
