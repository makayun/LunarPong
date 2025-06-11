import { Engine } from "@babylonjs/core/Engines/engine";

import { getOrCreateClientId } from "../helpers/helpers";
import type { User, GameType, InitGameSuccess, MeshPositions, MeshesDict, WSMessage, InitGameRequest } from "../defines/types";
import type { PongFrontScene } from "../scenes/PongFrontScene";
import { PongAIGame, PongLocalGame, PongRemoteGame } from "../scenes/PongFrontVariants";

const player: User = { id: getOrCreateClientId() };
const socket = new WebSocket(`ws://${window.location.host}/ws-game`);
const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
const engine: Engine = new Engine(canvas, true);

["Local game", "Remote game", "Versus AI"].forEach(type => {
	const btn = document.getElementById(type) as HTMLButtonElement;
	if (btn) {
		btn.addEventListener("click", () => {
			const initGameMsg: InitGameRequest = {
				type: "InitGameRequest",
				gameType: type as GameType,
				user: player
			};
			socket.send(JSON.stringify(initGameMsg));

			// Optional: hide buttons
			btn.disabled = true;
			btn.hidden = true;
		});
	}
});


// export async function createButtons(canvas: HTMLCanvasElement) {
// 	const localGameBtn = createOneButton("Local game");
// 	const remoteGameBtn = createOneButton("Remote game");
// 	const aiGameBtn = createOneButton("Versus AI");


// 	function createOneButton(inText: GameType) : HTMLButtonElement {
// 		const button = document.createElement("button");
// 		button.textContent = inText;
// 		button.id = inText;
// 		canvas.appendChild(button);

// 		button.addEventListener("click", () => {
// 			hideGameButtons();
// 			const initGameMsg: InitGameRequest = {
// 				type: "InitGameRequest",
// 				gameType: button.textContent as GameType,
// 				user: player
// 			};
// 			socket.send(JSON.stringify(initGameMsg));
// 		});

// 		return button;
// 	}

// 	function hideGameButtons() {
// 		localGameBtn.disabled = true;
// 		localGameBtn.hidden = true;
// 		remoteGameBtn.disabled = true;
// 		remoteGameBtn.hidden = true;
// 		aiGameBtn.disabled = true;
// 		aiGameBtn.hidden = true;
// 	}
// }

socket.onmessage = function(event: MessageEvent) {
	const msg = JSON.parse(event.data);
	if (msg.type === "InitGameSuccess") {
		babylonInit(msg);
	}
}

async function babylonInit(opts: InitGameSuccess) : Promise<void> {
	const pongScene = createFrontScene(opts);

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
			}
		} catch (error) {
			console.error("Wrong WS message:", error);
			// socket.send("Invalid WS message: " + JSON.stringify(error));
		}
	};

	// pongScene.executeWhenReady(() => {
		// engine.runRenderLoop(() => pongScene.render());
	// });


	window.addEventListener("resize", function () {
		engine.resize();
		pongScene.camera.zoomOn([
			pongScene.pongMeshes.edgeBottom,
			pongScene.pongMeshes.edgeLeft,
			pongScene.pongMeshes.edgeRight
		]);
	});
}

function createFrontScene(opts: InitGameSuccess) : PongFrontScene {
	switch (opts.gameType) {
		case "Local game":
			return new PongLocalGame(engine, opts, socket);
		case "Remote game":
			return new PongRemoteGame(engine, opts, socket);
		case "Versus AI":
			return new PongAIGame(engine, opts, socket);
	}
}

function applyMeshPositions (meshes: MeshesDict, newPositions: MeshPositions) : void {
	meshes.ball.position = newPositions.ball;
	meshes.paddleLeft.position = newPositions.paddleLeft;
	meshes.paddleRight.position = newPositions.paddleRight;
}

engine.runRenderLoop(() => {
	engine.scenes.forEach(scene =>
		scene.render()
	)
})
