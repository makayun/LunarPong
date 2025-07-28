// import { AIOpponent } from "./aiOpponent";
// import type { Game, MeshPositions, GUID } from "../defines/types";
// import { Vector3 as BabylonVector3 } from "@babylonjs/core/Maths/math.vector";

// const mockGame: Game = {
//   id: "game1" as GUID,
//   state: "running",
//   players: [],
// };

// function createMockPositions(
//   ballX: number,
//   ballY: number,
//   paddleRightY: number,
//   paddleLeftY: number
// ): MeshPositions {
//   return {
//     type: "MeshPositions",
//     ball: new BabylonVector3(ballX, ballY, 0),
//     paddleLeft: new BabylonVector3(-10, paddleLeftY, 0),
//     paddleRight: new BabylonVector3(10, paddleRightY, 0),
//   };
// }

// function runAITest() {
//   const ai = new AIOpponent(mockGame, "right");
//   let time = 1000;

//   let positions = createMockPositions(0, 2, 0, 0); // Мяч в (0,2), ракетка в (10,0)
//   console.log(`[${time}] Test 1 input: ballX=${positions.ball.x}, ballY=${positions.ball.y}`);
//   let input = ai.update(positions, time);
//   console.log(`[${time}] Тест 1 (мяч выше ракетки ?????):`, input);
//   time += 1000;

//   positions = createMockPositions(5, 1, 0, 0); // Мяч в (5,1)
//   console.log(`[${time}] Test 2 input: ballX=${positions.ball.x}, ballY=${positions.ball.y}`);
//   input = ai.update(positions, time);
//   console.log(`[${time}] Тест 2 (мяч всё ещё выше):`, input);
//   time += 1000;

//   positions = createMockPositions(8, 0, 0, 0); // Мяч в (8,0)
//   console.log(`[${time}] Test 3 input: ballX=${positions.ball.x}, ballY=${positions.ball.y}`);
//   input = ai.update(positions, time);
//   console.log(`[${time}] Тест 3 (мяч на уровне ракетки):`, input);
//   time += 1000;

//   positions = createMockPositions(3, -1, 0, 0); // Мяч в (3,-1)
//   console.log(`[${time}] Test 4 input: ballX=${positions.ball.x}, ballY=${positions.ball.y}`);
//   input = ai.update(positions, time);
//   console.log(`[${time}] Тест 4 (мяч движется влево):`, input);
// }

// runAITest();


// import {
//   GROUND_HEIGHT,
//   EDGE_HEIGHT,
//   PADDLE_STEP,
//   PADDLE_MIN_Z,
//   PADDLE_MAX_Z,
//   UP,
//   DOWN,
//   STOP
// } from "../defines/constants";

// import type { MeshPositions, PlayerInput, /*User,*/ Game/*, GUID*/ } from "../defines/types";
// import { Vector3 } from "@babylonjs/core/Maths/math.vector";
// // import { generateGuid } from '../helpers/helpers';

// interface AIOpponentConfig {
//   paddleSpeed: number; // Скорость движения ракетки (единиц в секунду)
//   updateInterval: number; // Интервал обновления (в мс, 1000 = 1 сек)
// }

// // [Добавлено] Интерфейс для команды в очереди с временной меткой
// interface QueuedInput {
//   input: PlayerInput;
//   timestamp: number;
// }

// export class AIOpponent {
//   //private user = Math.random().toString(36).substring(2, 15);
//   private game: Game; // Текущая игра
//   private config: AIOpponentConfig;
//   private lastUpdate: number = 0; // Время последнего обновления
//   private ballVelocity: Vector3 = new Vector3(0, 0, 0); // Скорость мяча
//   private lastBallPosition: Vector3 | null = null; // Последняя позиция мяча
//   // [Добавлено] Очередь для хранения команд
//   private inputQueue: QueuedInput[] = [];

//   constructor(game: Game) {
//     //this.user;
//     this.game = game;
//     this.config = {
//       paddleSpeed: PADDLE_STEP,
//       updateInterval: 100, // 👿 1000 !!!!!!!!!!!!!!!
//     };
//   }

//   update(positions: MeshPositions, currentTime: number): PlayerInput | null {
//     // [Добавлено] Проверяем, есть ли команды в очереди
//     if (this.inputQueue.length > 0) {
//       const nextInput = this.inputQueue[0];
//       // [Добавлено] Удаляем устаревшие команды (старше 500 мс)
//       if (currentTime - nextInput.timestamp > 500) {
//         this.inputQueue.shift();
//       } else {
//         // [Добавлено] Возвращаем первую команду из очереди
//         return this.inputQueue.shift()!.input;
//       }
//     }

//     if (currentTime - this.lastUpdate < this.config.updateInterval) {
//       // console.log(`[${currentTime}] Update skipped: too early`);
//       return null; // Обновляем только раз в секунду
//     }
//     this.lastUpdate = currentTime;

//     if (this.lastBallPosition) {
//       const deltaTime = this.config.updateInterval / 1000; // Время в секундах
//       this.ballVelocity = positions.ball
//         .subtract(this.lastBallPosition)
//         .scale(1 / deltaTime);
//       console.log(`[${currentTime}] Ball velocity: x=${this.ballVelocity.x}, y=${this.ballVelocity.y}`);
//     } else {
//       /* Для первого шага предполагаем, что мяч движется к AI */
//       const paddleZ = positions.paddleRight.z;
//       this.ballVelocity = new Vector3(5, 0, positions.ball.z - paddleZ);

//       console.log(`[${currentTime}] Initial ball velocity: x=${this.ballVelocity.x}, y=${this.ballVelocity.y}`);
//     }
//     this.lastBallPosition = positions.ball.clone();

//     /* Предсказываем, где мяч пересечет линию ракетки */
//     const predictedZ = this.predictBallPosition(positions);
//     const paddleZ = positions.paddleRight.z;
//     console.log(`[${currentTime}] Predicted Z: ${predictedZ}`);
//     console.log(`[${currentTime}] Paddle Z: ${paddleZ}`);

//     /* Логика принятия решения */
//     const threshold = 0.5; // Допустимое отклонение

//     // if (predictedZ > paddleZ + threshold) direction = UP;
//     // else if (predictedZ < paddleZ - threshold) direction = DOWN;

//     if (predictedZ < paddleZ - threshold) direction = UP;
//     else if (predictedZ > paddleZ + threshold) direction = DOWN;

//     let direction: typeof UP | typeof DOWN | typeof STOP = STOP;

//     if (direction !== STOP) {
//       const input: PlayerInput = {
//         type: "PlayerInput",
//         side: "right",
//         gameId: this.game.id,
//         direction,
//       };
//       // [Добавлено] Добавляем команду в очередь
//       this.inputQueue.push({
//         input,
//         timestamp: currentTime,
//       });
//       // [Добавлено] Возвращаем первую команду из очереди
//       return this.inputQueue.shift()!.input;
//     }
//     return null;
//   }

//   /* Предсказываем, где мяч пересечет линию ракетки */
//   private predictBallPosition(positions: MeshPositions): number {
//     const ball = positions.ball;
//     const paddleX = positions.paddleRight.x;

//     console.log(`[${this.lastUpdate}] Ball position: x=${ball.x}, y=${ball.y}`);
//     console.log(`[${this.lastUpdate}] Paddle X: ${paddleX}, Velocity X: ${this.ballVelocity.x}`);

//     /* Если мяч движется в сторону AI */
//     if (this.ballVelocity.x > 0) {
//       const distanceToPaddle = Math.abs(paddleX - ball.x);
//       const timeToPaddle = this.ballVelocity.x !== 0
//           ? distanceToPaddle / /*Math.abs(*/this.ballVelocity.x/*)*/
//           : Infinity;
//       console.log(`[${this.lastUpdate}] Time to paddle: ${timeToPaddle}`);

//       if (timeToPaddle === Infinity || timeToPaddle <= 1) {
//         console.log(
//           `[${this.lastUpdate}] Ball close or infinite time, using current ball Z: ${ball.z}`
//         );
//         return ball.z; // [Исправлено] Заменено ball.y на ball.z
//       }

//       /* Расчёт Z с учётом возможных отражений от верхнего и нижнего края */
//       const upperBound = GROUND_HEIGHT / 2 - EDGE_HEIGHT;
//       const lowerBound = -GROUND_HEIGHT / 2 + EDGE_HEIGHT;

//       let predictedZ = ball.z + this.ballVelocity.z * timeToPaddle;

//       /* логика отражения от границ */
//       const fieldHeight = upperBound - lowerBound;
//       const offset = predictedZ - lowerBound;

//       const bounces = Math.floor(offset / fieldHeight);
//       const remainder = offset % fieldHeight;

//       if (bounces % 2 === 0) {
//         predictedZ = lowerBound + remainder;
//       } else {
//         predictedZ = upperBound - remainder;
//       }
//       /* ограничиваем в пределах поля */
//       if (predictedZ > PADDLE_MAX_Z) predictedZ = PADDLE_MAX_Z;
//       if (predictedZ < PADDLE_MIN_Z) predictedZ = PADDLE_MIN_Z;

//       console.log(`[${this.lastUpdate}] Predicted Z (clamped): ${predictedZ}`);
//       return predictedZ;
//     }

//     console.log(`[${this.lastUpdate}] Ball moving away, returning paddle`);
//     return positions.paddleRight.z;
//   }

//   usePowerUp(): PlayerInput | null {
//     return null; // 💥💥💥Заглушка для power-up
//   }
// }