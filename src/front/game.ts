import '../styles/output.css';
// import '../styles/styles.css';

import { Engine } from "@babylonjs/core/Engines/engine";
import { PongFrontScene } from "../scenes/PongFrontScene";
import { getUserId } from '../helpers/helpers';
import { aiInputHandler, localInputHandler, remoteInputHandler } from './gameInputVariants';
import type { User, GameType, InitGameSuccess, MeshPositions, MeshesDict, WSMessage } from "../defines/types";
import { initGameButtons, setGameButtons } from './gameButtons';

const gameButtons = initGameButtons();

async function gameMain() {
	const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
	const engine = new Engine(canvas, true);
	const pongScene = new PongFrontScene(engine);
	const player: User = { id: await getUserId() };

	pongScene.executeWhenReady(() => {
		engine.runRenderLoop(() => pongScene.render());

		window.addEventListener("resize", function () {
			engine.resize();
			pongScene.camera.zoomOn([
				pongScene.pongMeshes.edgeBottom,
				pongScene.pongMeshes.edgeLeft,
				pongScene.pongMeshes.edgeRight
			]);
		});

		setGameButtons(gameButtons, pongScene, player);
	})


	pongScene.socket.onmessage = async function(event: MessageEvent) {
		const msg = JSON.parse(event.data);
		if (msg.type === "InitGameSuccess") {
			await gameInit(pongScene, player, msg);
		}
	}
}

async function gameInit(pongScene: PongFrontScene, player: User, opts: InitGameSuccess) : Promise<void> {
	pongScene.side = opts.playerSide;
	pongScene.id = opts.gameId;
	pongScene.sendPlayerInput =  assignInputHandler(pongScene, opts.gameType);

	let meshPositions: MeshPositions = {
		type: "MeshPositions",
		ball: pongScene.pongMeshes.ball.position,
		paddleLeft: pongScene.pongMeshes.paddleLeft.position,
		paddleRight: pongScene.pongMeshes.paddleRight.position
	};

	pongScene.registerBeforeRender(() => applyMeshPositions(pongScene.pongMeshes, meshPositions));
	pongScene.registerAfterRender(() => pongScene.sendPlayerInput(pongScene.socket));

	pongScene.socket.onmessage = function(event: MessageEvent) {
		try {
			const message: WSMessage = JSON.parse(event.data);

			switch (message.type) {
				case "MeshPositions":
					meshPositions = message;
					break;
				case "ScoreUpdate":
					pongScene.updateScore(message.score);
					break;
				case "BallCollision":
					pongScene.animateHighlightIntensity(message.collidedWith);
					break;
				case "GameOver":
					setGameButtons(gameButtons, pongScene, player);
			}
		} catch (error) {
			console.error("Wrong WS message:", error);
			// socket.send("Invalid WS message: " + JSON.stringify(error));
		}
	};
}


function assignInputHandler(pongScene: PongFrontScene, gameType: GameType) {
	switch (gameType) {
		case "Local game":
			return localInputHandler(pongScene);
		case "Remote game":
			return remoteInputHandler(pongScene);
		case "Versus AI":
			return aiInputHandler(pongScene);
	}
}


function applyMeshPositions (meshes: MeshesDict, newPositions: MeshPositions) : void {
	meshes.ball.position = newPositions.ball;
	meshes.paddleLeft.position = newPositions.paddleLeft;
	meshes.paddleRight.position = newPositions.paddleRight;
}

gameMain();
