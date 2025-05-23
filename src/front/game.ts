import { Engine }				from "@babylonjs/core/Engines/engine";
import { PongFrontScene }		from "../scenes/PongFrontScene";
import { paddleMovement }		from "./paddleMovements";
import { getOrCreateClientId }	from "../helpers/helpers";
import type { User, WSMessage }	from "../defines/types";


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
		const initMsg: WSMessage = { type: "WsInit", user: player };
		socket.send(JSON.stringify(initMsg));
		pongScene.state = "running";
	})

	engine.runRenderLoop(function () {
		if (pongScene.state !== "init") {
			paddleMovement(pongScene, pongScene.pongMeshes);
		}
		pongScene.render();
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
