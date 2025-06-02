import { Engine }				from "@babylonjs/core/Engines/engine";
import { PongFrontScene }		from "../scenes/PongFrontScene";
// import { paddleMovement }		from "./paddleMovements";
import { getOrCreateClientId }	from "../helpers/helpers";
import type { MeshesDict, MeshPositions, PlayerInput, User, WSMessage }	from "../defines/types";

export const babylonInit = async (): Promise<void> => {
	const socket: WebSocket = new WebSocket("ws://localhost:12800/ws-game");
	const player: User = { id: getOrCreateClientId() };

	const startButton = document.getElementById("startButton") as HTMLButtonElement;
	const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
	const engine: Engine = new Engine(canvas, true);
	const pongScene: PongFrontScene = new PongFrontScene(engine);
	let meshPositions: MeshPositions = {
		type: "MeshPositions",
		ball: pongScene.pongMeshes.ball.position,
		paddleLeft: pongScene.pongMeshes.paddleLeft.position,
		paddleRight: pongScene.pongMeshes.paddleRight.position
	};
	let input: PlayerInput = {
		type: "PlayerInput",
		userId: player.id,
		direction: 0
	}

	window.onkeydown = (ev) => {
		switch (ev.key) {
			case 'w': case 'ArrowUp':
				input.direction = -1;
				break;
			case 's': case 'ArrowDown':
				input.direction = 1;
				break;
		}
	}

	window.onkeyup = (ev) => {
		if (ev.key === 'w' || ev.key === 's' || ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
			input.direction = 0;
		}
	}

	pongScene.registerBeforeRender(() => applyMeshPositions(pongScene.pongMeshes, meshPositions));
	// pongScene.registerAfterRender(() => sendPlayerInput(input, socket));


	startButton.addEventListener("click", () => {
		startButton.hidden = true;
		startButton.disabled = true;
		const initMsg: WSMessage = { type: "InitGameRequest", user: player };
		socket.send(JSON.stringify(initMsg));
	})

	socket.onmessage = function(event: MessageEvent) {
		try {
			const message: WSMessage = JSON.parse(event.data);

			switch (message.type) {
				case "InitGameSuccess":
					player.gameId = message.gameId;
					pongScene.state = message.gameState;
					input.gameId = message.gameId;
					break;
				case "MeshPositions":
					meshPositions = message;
					break;
			}
		} catch (error) {
			console.error("Wrong WS message:", error);
			// socket.send("Invalid WS message: " + JSON.stringify(error));
		}
	};


	engine.runRenderLoop(function () {
		if (pongScene.state !== "init") {
			pongScene.render();
			sendPlayerInput(input, socket);
			// paddleMovement(pongScene, pongScene.pongMeshes);
		}
	});

	window.addEventListener("resize", function () {
		engine.resize();
		pongScene.camera.zoomOn([
			pongScene.pongMeshes.edgeBottom,
			pongScene.pongMeshes.edgeLeft,
			pongScene.pongMeshes.edgeRight
		]);
	});
};

babylonInit().then(() => {});

function sendPlayerInput(input: PlayerInput, socket: WebSocket) {
	socket.send(JSON.stringify(input));
}

function applyMeshPositions (meshes: MeshesDict, newPositions: MeshPositions) : void {
	meshes.ball.position = newPositions.ball;
	meshes.paddleLeft.position = newPositions.paddleLeft;
	meshes.paddleRight.position = newPositions.paddleRight;
}
