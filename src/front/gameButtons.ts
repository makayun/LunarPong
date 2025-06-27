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
	return (buttons);
}

export function setGameButtons(buttons: GameButtons, pongScene: PongFrontScene, player: User) {
	buttons.forEach(btn => {
		btn.disabled = false;
		btn.classList.remove("hidden","absolute","relative","w-96","cursor-not-allowed");
		btn.classList.add("flex");

		btn.addEventListener("click", () => {
			const initGameMsg: InitGameRequest = {
				type: "InitGameRequest",
				gameType: btn.id as GameType,
				user: player
			};
			pongScene.socket.send(JSON.stringify(initGameMsg));
			unsetGameButtons(buttons, btn.id as GameType);
		}, { once: true });
	})
}


export function unsetGameButtons(buttons: GameButtons, type: GameType) {
	buttons.forEach(btn => {
		btn.disabled = true;
		if (btn.id === type) {
			btn.classList.add("relative","w-96","cursor-not-allowed","justify-center","items-center");
		} else {
			btn.classList.remove("flex");
			btn.classList.add("hidden","absolute");
		}
	})
}
