import { Engine }			from "@babylonjs/core/Engines/engine";

import { PongFrontScene }	from "../scenes/PongFrontScene";
import { paddleMovement }	from "./paddleMovements";

export const babylonInit = async (): Promise<void> => {
	const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
	const engine: Engine = await new Engine(canvas, true);
	const pongScene: PongFrontScene = new PongFrontScene(engine);

	engine.runRenderLoop(function () {
		paddleMovement(pongScene.scene, pongScene.meshes);
		pongScene.scene.render();
	});

	window.addEventListener("resize", function () {
		engine.resize();
		pongScene.camera.zoomOn([
			pongScene.meshes.edgeBottom,
			pongScene.meshes.edgeLeft,
			pongScene.meshes.edgeRight
		]);
	});


};

babylonInit().then(() => {});
