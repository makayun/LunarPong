
import { User } from "../defines/types";
import { generateGuid } from "../helpers/helpers";
import { PongBackEngine, PongBackScene } from "../scenes/PongBackScene";

const engine = new PongBackEngine;

const players: User[] = [
  { id: generateGuid(), gameId: new PongBackScene(engine).id },
  { id: generateGuid() },                // scene is undefined
  { id: generateGuid(), gameId: new PongBackScene(engine).id },
  { id: generateGuid(), gameId: new PongBackScene(engine).id },
];


players.sort((a, b) => {
	if(a.gameId === undefined) return 1;
	if(b.gameId === undefined) return -1;
	return a.gameId.localeCompare(b.gameId);
});

players.forEach(player => console.log(player));
