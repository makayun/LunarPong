import '../styles/output.css';
import '../styles/styles.css';

import { Engine } from "@babylonjs/core/Engines/engine";

import { getOrCreateClientId } from "../helpers/helpers";
import type { User, GameType, InitGameSuccess, MeshPositions, MeshesDict, WSMessage, InitGameRequest } from "../defines/types";
import { PongFrontScene } from "../scenes/PongFrontScene";
import { aiInputHandler, localInputHandler, remoteInputHandler } from './gameInputVariants';

const player: User = { id: getOrCreateClientId() };
const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
const engine: Engine = new Engine(canvas, true);
const pongScene = new PongFrontScene(engine);

pongScene.executeWhenReady(() => {
	["Local game", "Remote game", "Versus AI"].forEach(type => {
		engine.runRenderLoop(() => pongScene.render());

		const btn = document.getElementById(type) as HTMLButtonElement;
		if (btn) {
			btn.addEventListener("click", () => {
				const initGameMsg: InitGameRequest = {
					type: "InitGameRequest",
					gameType: type as GameType,
					user: player
				};
				pongScene.socket.send(JSON.stringify(initGameMsg));

				btn.disabled = true;
				btn.classList.add("relative","w-96","cursor-not-allowed");
				// btn.hidden = true;
				["Local game", "Remote game", "Versus AI"].forEach(otherType => {
					if (otherType !== type) {
						const otherBtn = document.getElementById(otherType) as HTMLButtonElement;
						if (otherBtn != btn) {
							otherBtn.disabled = true;
							otherBtn.classList.remove("flex");
							otherBtn.classList.add("hidden","absolute");
						}
					}
				});
			});
		}
	});
})


pongScene.socket.onmessage = function(event: MessageEvent) {
	const msg = JSON.parse(event.data);
	if (msg.type === "InitGameSuccess") {
		babylonInit(msg);
	}
}

export default async function babylonInit(opts: InitGameSuccess) : Promise<void> {
	pongScene.side = opts.playerSide;
	pongScene.id = opts.gameId;
	pongScene.sendPlayerInput =  assignInputHandler(opts.gameType);

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
			}
		} catch (error) {
			console.error("Wrong WS message:", error);
			// socket.send("Invalid WS message: " + JSON.stringify(error));
		}
	};

	// engine.runRenderLoop(() => pongScene.render());

	window.addEventListener("resize", function () {
		engine.resize();
		pongScene.camera.zoomOn([
			pongScene.pongMeshes.edgeBottom,
			pongScene.pongMeshes.edgeLeft,
			pongScene.pongMeshes.edgeRight
		]);
	});
}

function assignInputHandler(gameType: GameType) {
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
