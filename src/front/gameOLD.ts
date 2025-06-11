import { Engine }				from "@babylonjs/core/Engines/engine";
import { PongFrontScene }		from "../scenes/PongFrontScene";
import { getOrCreateClientId }	from "../helpers/helpers";
import type { MeshesDict, MeshPositions, GUID, PlayerSide, User, WSMessage, PlayerInput }	from "../defines/types";

export const babylonInit = async (): Promise<void> => {
	const socket = new WebSocket(`ws://${window.location.host}/ws-game`);
	const player: User = { id: getOrCreateClientId() };
	let side: PlayerSide;

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
					side = message.playersSide;
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
			sendPlayerInput(player.gameId as GUID, side, socket);
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

function sendPlayerInput(inGameId: GUID, inSide: PlayerSide, socket: WebSocket) {
	window.onkeydown = (ev) => {
		// if (ev.repeat) return;

		let inputMessage: PlayerInput = {
			type: "PlayerInput",
			gameId: inGameId,
			side: inSide,
			direction: 0
		}

		switch (ev.key) {
			case 'w':
				inputMessage.direction = 1;
				socket.send(JSON.stringify(inputMessage));
				break;
			case 's':
				inputMessage.direction = -1;
				socket.send(JSON.stringify(inputMessage));
				break;
		};
	}
}

function applyMeshPositions (meshes: MeshesDict, newPositions: MeshPositions) : void {
	meshes.ball.position = newPositions.ball;
	meshes.paddleLeft.position = newPositions.paddleLeft;
	meshes.paddleRight.position = newPositions.paddleRight;
}
