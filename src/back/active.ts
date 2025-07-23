import Session from "./session";
import type { WebSocket  } from "@fastify/websocket";

export default class ActiveService {
	private session: Session[] = [];

	constructor() {
		;
	}

	add (id: number, socket: WebSocket): boolean {
		if (this.isActive(id))
			return false;
		try {
			this.session.push(new Session(id, socket));
			return true;
		} catch (err: any) {
			return false;
		}
	}

	isActive (id: number): boolean {
		if (this.getSession(id) != -1)
			return true;
		else
			return false;
	}

	getSession (id: number): any {
		return this.session.findIndex(s => s.id === id);
	}

	async loop () {
		while (true) {
			 console.log("Checking sessions...");
        	// ✅ Do your DB or session logic here (can be async)
        	await new Promise((resolve) => setTimeout(resolve, 5000)); // sleep 5s
		}
	}
}
