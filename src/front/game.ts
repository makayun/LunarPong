import { Engine }				from "@babylonjs/core/Engines/engine";
// import { Animation }			from "@babylonjs/core";
import { PongFrontScene }		from "../scenes/PongFrontScene";
import { paddleMovement }		from "./paddleMovements";
import { getOrCreateClientId }	from "../helpers/helpers";
import type { MeshPositions, User, WSMessage }	from "../defines/types";



export const babylonInit = async (): Promise<void> => {
	const player: User = { id: getOrCreateClientId() };
	// let opponent: User;

	let stateQueue: MeshPositions[] = [];
	// let processingQueue: MeshPositions[] = [];
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
		pongScene.state = "running";
	})

	// socket on message - changes coordinates and state of the game
	socket.onmessage = function(event: MessageEvent) {
		try {
			const message: WSMessage = JSON.parse(event.data);

			switch (message.type) {
				case "MeshPosition":
					stateQueue.push(message);
					break;
			}
		} catch (error) {
			console.error("Wrong WS message:", error);
			socket.send("Invalid WS message: " + JSON.stringify(error));
		}
	};


	engine.runRenderLoop(function () {
		if (pongScene.state !== "init") {
			// apply coordinates
			// applyCoordinntes(stateQueue, processingQueue);
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

// function applyCoordinates(scene: PongFrontScene, stateQueue: MeshPositions[], processingQueue: MeshPositions[]) {
// 	[stateQueue, processingQueue] = [[], stateQueue];
// 	processingQueue.forEach(state => {

// 	})
// }

// function animatePaddleToX(mesh: Mesh, targetX: number, duration: number = 200): void {
// 	const animation = new Animation(
// 		"paddleMove",
// 		"position.z",
// 		FPS,
// 		Animation.ANIMATIONTYPE_FLOAT,
// 		Animation.ANIMATIONLOOPMODE_CONSTANT
// 	);

// 	const x = clampPaddleX(targetX);

// 	const keys = [
// 		{ frame: 0, value: mesh.position.z },
// 		{ frame: FPS * (duration / 1000), value: x }
// 	];

// 	animation.setKeys(keys);
// 	mesh.animations = [animation];
// 	mesh.getScene().beginAnimation(mesh, 0, keys[keys.length - 1].frame, false);
// }
