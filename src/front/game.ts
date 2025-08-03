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
		socket.addEventListener('open', () => {
			console.debug("WebSocket (socket_g) connection established.");
      		socket.send(JSON.stringify({ type: 'register', user}));
    	});
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
	pongScene.animateVisibility(pongScene.pongMeshes.ball, 0, 1, 2000);

	socket.onmessage = function(event: MessageEvent) {
		try {
			const message: WSMessage = JSON.parse(event.data);

			switch (message.type) {
				case "MeshPositions":
					meshPositions = message;
					break;
				case "ScoreUpdate":
					pongScene.animateVisibility(pongScene.pongMeshes.ball, 0, 1);
					pongScene.updateScore(message.score);
					break;
				case "BallCollision":
					pongScene.animateHighlightIntensity(message.collidedWith);
					break;
				case "GameOver":
					pongScene.animateVisibility(pongScene.pongMeshes.ball, 1, 0);
					showSuccessMessage({ type: 'LocalWon', winner: player.nick});
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

function assignInputHandler(pongScene: PongFrontScene, gameType: GameType, socket: WebSocket): (_socket: WebSocket) => void {
	switch (gameType) {
		case "Local game":
			showSuccessMessage({ type: 'LocalCreated', playerCount: 2 });
			return localInputHandler(pongScene, socket);
		case "Remote game":
			showSuccessMessage({ type: 'RemoteStarted' });
			return remoteInputHandler(pongScene, socket);
		case "Versus AI":
			return aiInputHandler(pongScene, socket);
		default:
			return () => {};
	}
}


function showSuccessMessage(data: { name?: string; playerCount?: number; type: 'LocalCreated' | 'LocalStarted' | 'RemoteStarted' | 'LocalWon' | "RemoteWon"; winner?: string }): void {
  const successDiv = document.createElement('div');
  successDiv.className = `
  fixed top-5 right-5 z-[2000]
  text-white font-semibold font-mono
  px-6 py-4 rounded-2xl
  border-2 border-[--color-blue]
  backdrop-blur-md
  bg-[rgba(0,0,0,0.9)]
  shadow-[0_0_6px_var(--color-white)]
  transform translate-x-full
  transition-transform duration-300 ease-out
  pointer-events-none
`;

  let message: string = '';
  switch (data.type) {
	case 'LocalCreated':
	  message = `Local game created!`;
	  break;
	case 'RemoteStarted':
	  message = 'Remote game created. Now go play or wait until someone will connect!';
	  break;
	case 'LocalWon':
	  message = `Gongratulations with finishing this great game!`;
	  break;
	case 'RemoteWon':
	  message = `${data.winner} won the game!`;
	  break;
  }

  successDiv.textContent = message;

  document.body.appendChild(successDiv);

  setTimeout(() => {
    successDiv.classList.remove('translate-x-full');
    successDiv.classList.add('translate-x-0');
  }, 100);

  setTimeout(() => {
    successDiv.classList.add('translate-x-full');
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 300);
  }, 3000);
}
