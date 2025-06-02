import type { MeshPositions, PlayerInput, User, Game, Vector3, GUID } from "../defines/types";
import { Vector3 as BabylonVector3 } from "@babylonjs/core/Maths/math.vector";

interface AIOpponentConfig {
  paddleSpeed: number; // Скорость движения ракетки (единиц в секунду)
  updateInterval: number; // Интервал обновления (в мс, 1000 = 1 сек)
  paddleSide: "left" | "right"; // Сторона ракетки AI
}

export class AIOpponent {
  private user: User; // Псевдо-пользователь для AI
  private game: Game; // Текущая игра
  private config: AIOpponentConfig;
  private lastUpdate: number = 0; // Время последнего обновления
  private ballVelocity: Vector3 = new BabylonVector3(0, 0, 0); // Скорость мяча
  private lastBallPosition: Vector3 | null = null; // Последняя позиция мяча

  constructor(game: Game, paddleSide: "left" | "right") {
    this.user = {
      id: `AI_${Math.random().toString(36).slice(2)}` as GUID,
      gameId: game.id,
    };
    this.game = game;
    this.config = {
      paddleSpeed: 5,
      updateInterval: 1000,
      paddleSide,
    };
  }

  update(positions: MeshPositions, currentTime: number): PlayerInput | null {
    if (currentTime - this.lastUpdate < this.config.updateInterval) {
      console.log(`[${currentTime}] Update skipped: too early`);
      return null; // Обновляем только раз в секунду
    }
    this.lastUpdate = currentTime;

    if (this.lastBallPosition) {
      const deltaTime = this.config.updateInterval / 1000; // Время в секундах
      this.ballVelocity = positions.ball
        .subtract(this.lastBallPosition)
        .scale(1 / deltaTime);
      console.log(`[${currentTime}] Ball velocity: x=${this.ballVelocity.x}, y=${this.ballVelocity.y}`);
    } else {
      /* Для первого шага предполагаем, что мяч движется к AI */
      const paddleY = this.config.paddleSide === "right" ? positions.paddleRight.y : positions.paddleLeft.y;
      this.ballVelocity = new BabylonVector3(
        this.config.paddleSide === "right" ? 5 : -5, // Скорость по X
        positions.ball.y - paddleY, // Скорость по Y основана на разнице
        0
      );
      console.log(`[${currentTime}] Initial ball velocity: x=${this.ballVelocity.x}, y=${this.ballVelocity.y}`);
    }
    this.lastBallPosition = positions.ball.clone();

    /* Предсказываем, где мяч пересечет линию ракетки */
    const predictedY = this.predictBallPosition(positions);
    console.log(`[${currentTime}] Predicted Y: ${predictedY}`);

    /* Определяем позицию своей ракетки */
    const paddleY =
      this.config.paddleSide === "right"
        ? positions.paddleRight.y
        : positions.paddleLeft.y;
    console.log(`[${currentTime}] Paddle Y: ${paddleY}`);

    /* Логика принятия решения */
    let key: "w" | "s" | "ArrowUp" | "ArrowDown" | null = null;
    const threshold = 0.5; // Допустимое отклонение
    if (predictedY > paddleY + threshold) {
      key = this.config.paddleSide === "left" ? "w" : "ArrowUp";
    } else if (predictedY < paddleY - threshold) {
      key = this.config.paddleSide === "left" ? "s" : "ArrowDown";
    }

    let direction: -1 | 0 | 1 = 0;
    if (key === "w" || key === "ArrowUp") direction = -1;  // вверх
    else if (key === "s" || key === "ArrowDown") direction = 1;  // вниз

    console.log(`[${currentTime}] AI decision: ${key || "null"}`);
    if (key) {
      return {
        type: "PlayerInput",
        side: this.config.paddleSide,
        gameId: this.game.id,
        direction,
      };
    }
    return null;
  }

  /* Предсказание позиции мяча */
  private predictBallPosition(positions: MeshPositions): number {
    const ball = positions.ball;
    const paddleX =
      this.config.paddleSide === "right"
        ? positions.paddleRight.x
        : positions.paddleLeft.x;

    console.log(`[${this.lastUpdate}] Ball position: x=${ball.x}, y=${ball.y}`);
    console.log(`[${this.lastUpdate}] Paddle X: ${paddleX}, Velocity X: ${this.ballVelocity.x}`);

    /* Если мяч движется в сторону AI */
    if (
      (this.config.paddleSide === "right" && this.ballVelocity.x > 0) ||
      (this.config.paddleSide === "left" && this.ballVelocity.x < 0)
    ) {
      const distanceToPaddle = Math.abs(paddleX - ball.x);
      const timeToPaddle = this.ballVelocity.x !== 0 ? distanceToPaddle / Math.abs(this.ballVelocity.x) : Infinity;
      console.log(`[${this.lastUpdate}] Time to paddle: ${timeToPaddle}`);

      if (timeToPaddle === Infinity || timeToPaddle <= 1) {
        console.log(`[${this.lastUpdate}] Ball close or infinite time, using current ball Y: ${ball.y}`);
        return ball.y;
      }

      const predictedY = ball.y + this.ballVelocity.y * timeToPaddle;
      console.log(`[${this.lastUpdate}] Predicted Y (calculated): ${predictedY}`);
      return predictedY;
    }

    console.log(`[${this.lastUpdate}] Ball moving away, returning paddle Y`);
    return this.config.paddleSide === "right"
      ? positions.paddleRight.y
      : positions.paddleLeft.y;
  }

  usePowerUp(): PlayerInput | null {
    return null; // 💥💥💥Заглушка для power-up
  }

  getUser(): User {
    return this.user;
  }
}
