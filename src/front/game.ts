// движок и сцена загружены всегда
// игрок загружается только по ивенту
// вместе с игроком открывается новый сокет и отправляется сообщение с айди и логином
// кнопки инициализированы в начале, но активны только после ивента
// по ивенту добавить слушалку init game succes


import { Engine } from "@babylonjs/core/Engines/engine";
import { PongFrontScene } from "../scenes/PongFrontScene";
import { aiInputHandler, localInputHandler, remoteInputHandler } from './gameInputVariants';
import type { User, GameType, InitGameSuccess, MeshPositions, MeshesDict, WSMessage } from "../defines/types";

const	canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
const	engine = new Engine(canvas, true);
const	pongScene = new PongFrontScene(engine);
var		user: User | null;

window.addEventListener("resize", function () {
	engine.resize();
	pongScene.camera.zoomOn([
		pongScene.pongMeshes.edgeBottom,
		pongScene.pongMeshes.edgeLeft,
		pongScene.pongMeshes.edgeRight
	]);
});

pongScene.executeWhenReady(() => {
	window.addEventListener("pongLogin", (e: CustomEventInit<User>) => {
		const inId = e.detail?.id;
		const inNick = e.detail?.nick;
		if (inId && inNick) {
			user = {
				id: inId,
				nick: inNick
			}
		}
		// засетапить кнопки
		// запустить движок
	})
})

window.addEventListener("pongLogoff", () => {
	engine.stopRenderLoop();
	user?.gameSocket?.close();
	user = null;
})
