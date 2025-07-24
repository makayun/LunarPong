import '../styles/output.css';
import { Engine } from "@babylonjs/core/Engines/engine";
import { PongFrontScene } from "../scenes/PongFrontScene";
import { aiInputHandler, localInputHandler, remoteInputHandler } from './gameInputVariants';
import { disableGameButtons, initGameButtons, setGameButtons } from "./gameButtons";
import type { User, GameType, InitGameSuccess, MeshPositions, WSMessage, User_f } from "../defines/types";

const	canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
const	engine = new Engine(canvas, true);
const	pongScene = new PongFrontScene(engine);
const	gameButtons = initGameButtons();
const	pongLogoff = new Event("pongLogoff");
var		socket: WebSocket;
var		user: User | null;
var		meshPositions: MeshPositions;

disableGameButtons(gameButtons);



pongScene.executeWhenReady(() => {
	window.addEventListener("resize", function () {
		engine.resize();
		pongScene.camera.zoomOn([
			pongScene.pongMeshes.edgeBottom,
			pongScene.pongMeshes.edgeLeft,
			pongScene.pongMeshes.edgeRight
		]);
	});
	meshPositions = {
		type: "MeshPositions",
		ball: pongScene.pongMeshes.ball.position,
		paddleLeft: pongScene.pongMeshes.paddleLeft.position,
		paddleRight: pongScene.pongMeshes.paddleRight.position
	};
	pongScene.registerBeforeRender(() => pongScene.applyMeshPositions(meshPositions));
	pongScene.registerAfterRender(() => pongScene.sendPlayerInput(socket));
})

window.addEventListener("pongLogin", (e: CustomEventInit<User_f>) => {
	const inId = e.detail?.id;
	const inNick = e.detail?.name;
	if (inId && inNick) {
		user = {
			id: inId,
			nick: inNick,
		}
		if (!socket || socket.readyState != socket.OPEN)
			socket = new WebSocket(`wss://${window.location.host}/ws-game`);
		setGameButtons(gameButtons, socket, user);
		setGameInitListener(pongScene, user);
		engine.runRenderLoop(() => pongScene.render());
		window.addEventListener("pongLogoff", () => {
			disableGameButtons(gameButtons);
			engine.stopRenderLoop();
			socket.close();
			user = null;
		})
	}
	else
		window.dispatchEvent(pongLogoff);
})


function setGameInitListener(pongScene:  PongFrontScene, player: User) {
	socket.onmessage =  async function(event: MessageEvent) {
		const msg = JSON.parse(event.data);
		if (msg.type === "InitGameSuccess") {
			await gameInit(pongScene, player, msg);
		}
	}
}

async function gameInit(pongScene: PongFrontScene, player: User, opts: InitGameSuccess) : Promise<void> {
	pongScene.score = [0,0];
	pongScene.updateScore(pongScene.score);
	pongScene.side = opts.playerSide;
	pongScene.id = opts.gameId;
	pongScene.sendPlayerInput =  assignInputHandler(pongScene, opts.gameType, socket);
	console.log(`Game initiated! Scene: [${pongScene.id}], player: [${player.nick}], input: ${window.onkeydown}`);

	socket.onmessage = function(event: MessageEvent) {
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
					window.onkeydown = null;
					setGameButtons(gameButtons, socket, player);
					setGameInitListener(pongScene, player);
					break;
			}
		} catch (error) {
			console.error("Wrong WS message:", event.data);
			// socket.send("Invalid WS message: " + JSON.stringify(error));
		}
	};
}

function assignInputHandler(pongScene: PongFrontScene, gameType: GameType, socket: WebSocket) {
	switch (gameType) {
		case "Local game":
			return localInputHandler(pongScene, socket);
		case "Remote game":
			return remoteInputHandler(pongScene, socket);
		case "Versus AI":
			return aiInputHandler(pongScene, socket);
	}
}
