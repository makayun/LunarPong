import { Engine }				from "@babylonjs/core/Engines/engine";
import { PongFrontScene }		from "../scenes/PongFrontScene";
import { paddleMovement }		from "./paddleMovements";
import { getOrCreateClientId }	from "../helpers/helpers";
import type { MeshesDict, MeshPositions, User, WSMessage }	from "../defines/types";

export const babylonInit = async (): Promise<void> => {
	const player: User = { id: getOrCreateClientId() };
	const socket: WebSocket = new WebSocket("ws://localhost:12800/ws-game");

	const startButton = document.getElementById("startButton") as HTMLButtonElement;
	const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
	const engine: Engine = new Engine(canvas, true);
	const pongScene: PongFrontScene = new PongFrontScene(engine);


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
					break;
				case "MeshPositions":
					console.log("Mesh postions received:", message.ball);
					pongScene.registerBeforeRender(() => applyMeshPositions(pongScene.pongMeshes, message));
					break;
			}
		} catch (error) {
			console.error("Wrong WS message:", error);
			socket.send("Invalid WS message: " + JSON.stringify(error));
		}
	};


	engine.runRenderLoop(function () {
		if (pongScene.state !== "init") {
			pongScene.render();
			paddleMovement(pongScene, pongScene.pongMeshes);
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

function applyMeshPositions (meshes: MeshesDict, newPositions: MeshPositions) : void {
	meshes.ball.position = newPositions.ball;
	meshes.paddleLeft.position = newPositions.paddleLeft;
	meshes.paddleRight.position = newPositions.paddleRight;
}
