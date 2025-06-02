import { AIOpponent } from "./aiOpponent";
import type { Game, MeshPositions, GUID } from "../defines/types";
import { Vector3 as BabylonVector3 } from "@babylonjs/core/Maths/math.vector";

const mockGame: Game = {
  id: "game1" as GUID,
  state: "running",
  players: [],
};

function createMockPositions(
  ballX: number,
  ballY: number,
  paddleRightY: number,
  paddleLeftY: number
): MeshPositions {
  return {
    type: "MeshPositions",
    ball: new BabylonVector3(ballX, ballY, 0),
    paddleLeft: new BabylonVector3(-10, paddleLeftY, 0),
    paddleRight: new BabylonVector3(10, paddleRightY, 0),
  };
}

function runAITest() {
  const ai = new AIOpponent(mockGame, "right");
  let time = 1000;

  let positions = createMockPositions(0, 2, 0, 0); // Мяч в (0,2), ракетка в (10,0)
  console.log(`[${time}] Test 1 input: ballX=${positions.ball.x}, ballY=${positions.ball.y}`);
  let input = ai.update(positions, time);
  console.log(`[${time}] Тест 1 (мяч выше ракетки ?????):`, input);
  time += 1000;

  positions = createMockPositions(5, 1, 0, 0); // Мяч в (5,1)
  console.log(`[${time}] Test 2 input: ballX=${positions.ball.x}, ballY=${positions.ball.y}`);
  input = ai.update(positions, time);
  console.log(`[${time}] Тест 2 (мяч всё ещё выше):`, input);
  time += 1000;

  positions = createMockPositions(8, 0, 0, 0); // Мяч в (8,0)
  console.log(`[${time}] Test 3 input: ballX=${positions.ball.x}, ballY=${positions.ball.y}`);
  input = ai.update(positions, time);
  console.log(`[${time}] Тест 3 (мяч на уровне ракетки):`, input);
  time += 1000;

  positions = createMockPositions(3, -1, 0, 0); // Мяч в (3,-1)
  console.log(`[${time}] Test 4 input: ballX=${positions.ball.x}, ballY=${positions.ball.y}`);
  input = ai.update(positions, time);
  console.log(`[${time}] Тест 4 (мяч движется влево):`, input);
}

runAITest();