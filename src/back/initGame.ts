import { PongBackScene }	from "../scenes/PongBackScene";
import { NullEngine }		from "@babylonjs/core/Engines/nullEngine";

export async function initGame(): Promise<PongBackScene> {
	const engine = new NullEngine();
	const pongScene = new PongBackScene(engine);

	await pongScene.preTasks;
	await pongScene.enablePhysics();

	return pongScene;
}
