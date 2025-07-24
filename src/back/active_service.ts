import UserSession from "./user_session";
import type { WebSocket } from "@fastify/websocket";

export default class ActiveService {
	private userSession: UserSession[] = [];

	constructor() {
		;
	}

	add (user: number, socket_g?: WebSocket | undefined, socket_c?: WebSocket | undefined): boolean {
		if (this.isActive(user))
			return false;
		try {
			this.userSession.push(new UserSession(user, socket_g, socket_c));
			return true;
		} catch (err: any) {
			return false;
		}
	}

	isActive (user: number): boolean {
		if (this.getSessionIDX(user) != -1)
			return true;
		else
			return false;
	}

	getSessionIDX (user: number): number {
		return this.userSession.findIndex(s => s.user === user);
	}

	getSession (idx: number): UserSession | undefined {
		return this.userSession[idx];
	}

	ping(userSession: UserSession) {
		try {
			if (!userSession.socket_g || !userSession.socket_c) {
				console.debug(`Session ${userSession.user} has no sockets or just one..`);
				// console.debug(`Session ${session.user} has no sockets, removing...`);
				// this.session = this.session.filter(s => s.user !== session.user); // remove dead session
				return;
			}
			if (userSession.socket_g && userSession.socket_c && (!userSession.socket_g.isAlive || !userSession.socket_c.isAlive)) {
				console.debug(`Session ${userSession.user} is not alive, removing...`);
				userSession.socket_g.terminate();
				userSession.socket_c.terminate();
				this.userSession = this.userSession.filter(s => s.user !== userSession.user); // remove dead session
				return;
			}

			// Reset isAlive before sending ping
			if (userSession.socket_g) {
				userSession.socket_g.isAlive = false;
				userSession.socket_g.ping(undefined, false, () => {
					console.debug(`Pinged socket_g ${userSession.user}`);
				});
			}
			if (userSession.socket_c) {
				userSession.socket_c.isAlive = false;
				userSession.socket_c.ping(undefined, false, () => {
					console.debug(`Pinged socket_c ${userSession.user}`);
				});
			}
		} catch (err: any) {
			console.error(`Failed to ping session ${userSession.user}:`, err);
			if (userSession.socket_g) userSession.socket_g.terminate();
			if (userSession.socket_c) userSession.socket_c.terminate();
			this.userSession = this.userSession.filter(s => s.user !== userSession.user);
		}
	}


	async loop () {
		while (true) {
			console.debug("Checking sessions...");
        	this.userSession.forEach(this.ping); 
        	await new Promise((resolve) => setTimeout(resolve, 5000)); // sleep 5s
		}
	}
}
