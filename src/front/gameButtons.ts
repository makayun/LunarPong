import type { GameType, GameButtons, User, InitGameRequest} from "../defines/types";
import type { PongFrontScene } from "../scenes/PongFrontScene";

export function initGameButtons() : GameButtons {
	const buttons = new Map<GameType, HTMLButtonElement>;
	const types: GameType[] = ["Local game", "Remote game", "Versus AI"];

	types.forEach(type => {
		const button = document.getElementById(type);
		if (button instanceof HTMLButtonElement)
			buttons.set(type, button);
	})
	if (types.length !== buttons.size)
		console.error("Game Buttons missing!!!");
	return (buttons);
}

const handlers = new Map<GameType, EventListener>();

function createInitGameHandler(
	type: GameType,
	pongScene: PongFrontScene,
	player: User,
	buttons: GameButtons
): EventListener {
	return () => {
		const initGameMsg: InitGameRequest = {
			type: "InitGameRequest",
			gameType: type,
			user: player,
		};
		pongScene.socket.send(JSON.stringify(initGameMsg));
		unsetGameButtons(buttons, type);
	};
}

export async function setGameButtons(buttons: GameButtons, pongScene: PongFrontScene, player: User) {
	buttons.forEach((btn, type) => {
		btn.disabled = false;
		btn.classList.remove("hidden", "absolute", "relative", "w-96", "cursor-not-allowed");
		btn.classList.add("flex");

		const handler = createInitGameHandler(type, pongScene, player, buttons);
		handlers.set(type, handler);
		btn.addEventListener("click", handler, { once: true });
	});
}

export function unsetGameButtons(buttons: GameButtons, type: GameType) {
	buttons.forEach((btn, btnType) => {
		const handler = handlers.get(btnType);
		if (handler) {
			btn.removeEventListener("click", handler);
			handlers.delete(btnType);
		}

		btn.disabled = true;
		if (btn.id === type) {
			btn.classList.add("relative", "w-96", "cursor-not-allowed", "justify-center", "items-center");
		} else {
			btn.classList.remove("flex");
			btn.classList.add("hidden", "absolute");
		}
	});
}

export function disableGameButtons(gameButtons: GameButtons) {
	gameButtons.forEach((btn) => { btn.disabled = true; });
}

export function enableGameButtons(gameButtons: GameButtons) {
	gameButtons.forEach((btn) => { btn.disabled = false; });
}
