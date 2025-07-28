import '../styles/output.css';
// import '../styles/styles.css';

import { Engine } from "@babylonjs/core/Engines/engine";
import { PongFrontScene } from "../scenes/PongFrontScene";
import { getUserId, getUserNickname } from '../helpers/helpers';
import { aiInputHandler, localInputHandler, remoteInputHandler } from './gameInputVariants';
import type { User, GameType, InitGameSuccess, MeshPositions, MeshesDict, WSMessage } from "../defines/types";
import { initGameButtons, setGameButtons } from './gameButtons';


const gameButtons = initGameButtons();

const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);
export const pongScene = new PongFrontScene(engine);

export async function gameMain() {
	// const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
	// const engine = new Engine(canvas, true);
	// const pongScene = new PongFrontScene(engine);
	let player: User | null = { id: await getUserId() };

	const logoffBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="logoff"]`);
	if (logoffBtn) {
		logoffBtn.addEventListener("click", async function() {
			player = null;
		})
	}

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

	setGameInitListener(pongScene, player);
}

async function gameInit(pongScene: PongFrontScene, player: User | null, opts: InitGameSuccess) : Promise<void> {
	if (!player)
		player = { id: await getUserId(), nick: await getUserNickname() };
	pongScene.score = [0,0];
	pongScene.updateScore(pongScene.score);
	pongScene.side = opts.playerSide;
	pongScene.id = opts.gameId;
	pongScene.sendPlayerInput =  assignInputHandler(pongScene, opts.gameType);
	console.log(`Game initiated! Scene: [${pongScene.id}], player: [${player.nick}], input: ${window.onkeydown}`);

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
					showSuccessMessage({ type: 'LocalWon', winner: player.nick});
					window.onkeydown = null;
					setGameButtons(gameButtons, pongScene, player);
					setGameInitListener(pongScene, player);
					break;
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
			showSuccessMessage({ type: 'LocalCreated', playerCount: 2 });
			return localInputHandler(pongScene);
		case "Remote game":
			showSuccessMessage({ type: 'RemoteStarted' });
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

function setGameInitListener(pongScene:  PongFrontScene, player: User) {
	pongScene.socket.onmessage =  async function(event: MessageEvent) {
		const msg = JSON.parse(event.data);
		if (msg.type === "InitGameSuccess") {
			await gameInit(pongScene, player, msg);
		}
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

// gameMain();
