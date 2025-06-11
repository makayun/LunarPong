import type { PlayerInput } from "../defines/types";
import { PongFrontScene } from "./PongFrontScene";

export class PongLocalGame extends PongFrontScene {
	override sendPlayerInput() : void {
		window.onkeydown = (ev) => {
			if (ev.repeat) return;

			let inputMessage: PlayerInput = {
				type: "PlayerInput",
				gameId: this.id,
				side: "left",
				direction: 0
			}

			switch (ev.key) {
				case 'w':
					inputMessage.direction = 1;
					this.socket.send(JSON.stringify(inputMessage));
					break;
				case 's':
					inputMessage.direction = -1;
					this.socket.send(JSON.stringify(inputMessage));
					break;
				case 'ArrowUp':
					inputMessage.side = "right";
					inputMessage.direction = 1;
					this.socket.send(JSON.stringify(inputMessage));
					break;
				case 'ArrowDown':
					inputMessage.side = "right";
					inputMessage.direction = -1;
					this.socket.send(JSON.stringify(inputMessage));
					break;
				// ??? default: print a message to use w, s or arrows ???
			};
		}
	}
}

export class PongRemoteGame extends PongFrontScene {
	override sendPlayerInput() : void {
		window.onkeydown = (ev) => {
			if (ev.repeat) return;

			let inputMessage: PlayerInput = {
				type: "PlayerInput",
				gameId: this.id,
				side: this.side,
				direction: 0
			}

			switch (ev.key) {
				case 'w':
					inputMessage.direction = 1;
					this.socket.send(JSON.stringify(inputMessage));
					break;
				case 's':
					inputMessage.direction = -1;
					this.socket.send(JSON.stringify(inputMessage));
					break;
				// ??? default: print a message to use w or s ???
			};
		}
	}
}

export class PongAIGame extends PongFrontScene {
	override sendPlayerInput() : void {
		window.onkeydown = (ev) => {
			if (ev.repeat) return;

			let inputMessage: PlayerInput = {
				type: "PlayerInput",
				gameId: this.id,
				side: "left",
				direction: 0
			}

			switch (ev.key) {
				case 'w':
					inputMessage.direction = 1;
					this.socket.send(JSON.stringify(inputMessage));
					break;
				case 's':
					inputMessage.direction = -1;
					this.socket.send(JSON.stringify(inputMessage));
					break;
				// ??? default: print a message to use w or s ???
			};
		}
	}
}

