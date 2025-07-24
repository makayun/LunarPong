import type { GUID, PlayerInput, PlayerSide/*, MeshPositions*/ } from "../defines/types";
import type { PongFrontScene } from "../scenes/PongFrontScene";
// import { AIOpponent } from "../back/aiOpponent";

function isChatInputFocused(): boolean {
	const chatInput = document.querySelector('.chat-input') as HTMLInputElement;
	return chatInput && document.activeElement === chatInput;
}

export function localInputHandler(scene: PongFrontScene, socket: WebSocket): () => void {
	return () => {
		window.onkeydown = (ev) => {
			if (ev.repeat) return;

			if (isChatInputFocused()) return;

			const inputMessage: PlayerInput = {
				type: "PlayerInput",
				gameId: scene.id as GUID,
				side: "left",
				direction: 0
			};

			switch (ev.key) {
				case "ArrowUp":
					ev.preventDefault();
					inputMessage.side = "right";
					inputMessage.direction = 1;
					socket.send(JSON.stringify(inputMessage));
					break;
				case "w":
				case "W":
					inputMessage.direction = 1;
					socket.send(JSON.stringify(inputMessage));
					break;
				case "ArrowDown":
					ev.preventDefault();
					inputMessage.side = "right";
					inputMessage.direction = -1;
					socket.send(JSON.stringify(inputMessage));
					break;
				case "s":
				case "S":
					inputMessage.direction = -1;
					socket.send(JSON.stringify(inputMessage));
					break;
				default:
					console.log("Use W/S or Arrow keys.");
			}
		};
	};
}

export function remoteInputHandler(scene: PongFrontScene, socket: WebSocket): () => void {
	return () => {
		window.onkeydown = (ev) => {
			if (ev.repeat) return;

			if (isChatInputFocused()) return;

			const inputMessage: PlayerInput = {
				type: "PlayerInput",
				gameId: scene.id as GUID,
				side: scene.side as PlayerSide,
				direction: 0
			};

			switch (ev.key) {
				case "w":
				case "W":
					inputMessage.direction = 1;
					socket.send(JSON.stringify(inputMessage));
					break;
				case "s":
				case "S":
					inputMessage.direction = -1;
					socket.send(JSON.stringify(inputMessage));
					break;
				default:
					console.log("Use W/S keys.");
			}
		};
	};
}

export function aiInputHandler(scene: PongFrontScene, socket: WebSocket): () => void {
	return () => {
		window.onkeydown = (ev) => {
			if (ev.repeat) return;

			const inputMessage: PlayerInput = {
				type: "PlayerInput",
				gameId: scene.id as GUID,
				side: "left",
				direction: 0
			};

			switch (ev.key) {
				case "w":
					inputMessage.direction = 1;
					socket.send(JSON.stringify(inputMessage));
					break;
				case "s":
					inputMessage.direction = -1;
					socket.send(JSON.stringify(inputMessage));
					break;
				default:
					console.log("Use W/S keys.");
			}
		};
	};
}
