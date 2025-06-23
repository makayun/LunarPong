import type { GUID, PlayerInput, PlayerSide } from "../defines/types";
import type { PongFrontScene } from "../scenes/PongFrontScene";

export function localInputHandler(scene: PongFrontScene): () => void {
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
				case "ArrowUp":
					inputMessage.side = "right";
					inputMessage.direction = 1;
					scene.socket.send(JSON.stringify(inputMessage));
					break;
				case "w":
					inputMessage.direction = 1;
					scene.socket.send(JSON.stringify(inputMessage));
					break;
				case "ArrowDown":
					inputMessage.side = "right";
					inputMessage.direction = -1;
					scene.socket.send(JSON.stringify(inputMessage));
					break;
				case "s":
					inputMessage.direction = -1;
					scene.socket.send(JSON.stringify(inputMessage));
					break;
				case "g":
					scene.animateHighlightIntensity("ball");
					break;
				default:
					console.log("Use W/S or Arrow keys.");
			}
		};
	};
}

export function remoteInputHandler(scene: PongFrontScene): () => void {
	return () => {
		window.onkeydown = (ev) => {
			if (ev.repeat) return;

			const inputMessage: PlayerInput = {
				type: "PlayerInput",
				gameId: scene.id as GUID,
				side: scene.side as PlayerSide,
				direction: 0
			};

			switch (ev.key) {
				case "w":
					inputMessage.direction = 1;
					scene.socket.send(JSON.stringify(inputMessage));
					break;
				case "s":
					inputMessage.direction = -1;
					scene.socket.send(JSON.stringify(inputMessage));
					break;
				default:
					console.log("Use W/S keys.");
			}
		};
	};
}

export function aiInputHandler(scene: PongFrontScene): () => void {
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
					scene.socket.send(JSON.stringify(inputMessage));
					break;
				case "s":
					inputMessage.direction = -1;
					scene.socket.send(JSON.stringify(inputMessage));
					break;
				default:
					console.log("Use W/S keys.");
			}
		};
	};
}
