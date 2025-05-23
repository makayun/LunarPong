import { PongBackScene }	from "../scenes/PongBackScene";
import type { NullEngine }		from "@babylonjs/core/Engines/nullEngine";

export async function initGame(engine: NullEngine): Promise<PongBackScene> {
	const pongScene = new PongBackScene(engine);

	pongScene.preTasks;
	await pongScene.enablePongPhysics();

	return pongScene;
}
