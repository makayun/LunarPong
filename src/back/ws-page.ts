import type { FastifyInstance }	from "fastify";
import type { FastifyRequest }	from "fastify";
import type { WebSocket }		from "@fastify/websocket";

// import { startGameLog } from "./db";
import { PongBackEngine }	from "../scenes/PongBackScene";
import { PongBackScene }	from "../scenes/PongBackScene";
import { PADDLE_STEP }				from "../defines/constants";
import { animatePaddleToX } from "./paddleMovement";
import type { InitGameRequest, WSMessage, User, InitGameSuccess, PlayerSide, GameType, GUID } from "../defines/types";
import { AIOpponent } from "./aiOpponent";
import { error } from "node:console";

import type { ChatMessage } from "../defines/types";

const users: Map<GUID, User> = new Map();
export interface WsGamePluginOptions { engine: PongBackEngine; users: User[] };


function broadcastUserList() {
  const payload = JSON.stringify({
    type: 'userlist',
    users: Array.from(users.values()).map((u) => ({ id: u.id, nick: u.nick })),
  });
  for (const user of users.values()) {
    user.chatSocket?.send(payload);
  }
}

function sendToUser(userId: GUID, message: any) {
  const user = users.get(userId);
  if (user?.chatSocket) {
    user.chatSocket.send(JSON.stringify(message));
  }
}

export async function wsPagePlugin(server: FastifyInstance, options: WsGamePluginOptions) {
  server.get("/ws-page", { websocket: true }, (socket: WebSocket, _req: FastifyRequest) => {
    let currentUser: User | null = null;

    const { engine } = options;

    socket.on("message", (data: string) => {
      try {
        const msg: ChatMessage = JSON.parse(data.toString());

        switch (msg.type) {
            case 'register': {
                const rawUser = msg.user;
                let nickname = (rawUser.nick && rawUser.nick.trim()) || `User-${rawUser.id.slice(0, 6)}`;
                const isNickTaken = Array.from(users.values()).some(u => u.nick === nickname);

                  if (isNickTaken) {
                  let suffix = 1;
                  let newNick: string;
                  do {
                    newNick = `${nickname}_${suffix++}`;  // никнейм_номер
                  } while (Array.from(users.values()).some(u => u.nick === newNick));
                  nickname = newNick;
                }

                currentUser = {
                ...rawUser,
                nick: nickname,
                chatSocket: socket,
                blocked: new Set<GUID>(),
            };

            users.set(currentUser.id, currentUser);
            socket.send(JSON.stringify({ type: 'system', content: `Welcome, ✨${currentUser.nick}✨` }));
            broadcastUserList();
            socket.send(JSON.stringify({ type: 'nick-confirm', nick: currentUser.nick }));
            break;
          }

          case 'message': {
            if (!currentUser) return;
            const recipientId = msg.to.id;
            const senderId = currentUser.id;

            const recipient = users.get(recipientId);
            if (!recipient || recipient.blocked?.has(senderId)) return;

            recipient.chatSocket?.send(JSON.stringify({
              type: 'message',
              from: senderId,
              to: { id: recipientId, nick: users.get(recipientId)?.nick },
              content: msg.content,
            }));
            break;
          }

          case 'broadcast': {
            if (!currentUser) return;
            for (const user of users.values()) {
              if (user.id !== currentUser.id && !user.blocked?.has(currentUser.id)) {
                user.chatSocket?.send(JSON.stringify({
                  type: 'message',
                  from: currentUser.id,
                  content: msg.content,
                }));
              }
            }
            break;
          }

          case 'block': {
            if (!currentUser) return;
            currentUser.blocked?.add(msg.user.id);
            break;
          }

          case 'unblock': {
            if (!currentUser) return;
            currentUser.blocked?.delete(msg.user.id);
            break;
          }

          case 'invite': {
            if (!currentUser) return;
            console.log('Invite received from', currentUser.id, 'to', msg.to.id);

            sendToUser(msg.to.id, {
              type: 'invite',
              from: currentUser.id,
              game: msg.game || 'pong',
            });
            break;
          }

          case 'notify': {
            if (!currentUser) return;
            for (const user of users.values()) {
              user.chatSocket?.send(JSON.stringify({ type: 'system', content: msg.content }));
            }
            break;
          }

          case 'profile': {
            if (!currentUser) return;

            const requestedUser = users.get(msg.user.id);
            if (!requestedUser) {
              socket.send(JSON.stringify({
                type: 'profile',
                user: { id: msg.user.id },
                error: 'User not found'
              }));
              return;
            }

            // 💥💥💥Здесь должны быть реальные данные!
            socket.send(JSON.stringify({
              type: 'profile',
              user: {
                id: requestedUser.id,
                nick: requestedUser.nick
              },
              rating: 4.2,       // 💥💥💥Заглушка
              wins: 42,          // 💥💥💥Заглушка
              streak: 5          // 💥💥💥Заглушка
            }));
            break;
          }

          default:
            console.warn("Unknown message type:", msg);
        }
      } catch (err) {
        socket.send(JSON.stringify({ type: 'system', content: 'Invalid message format.' }));
      }
    });

    console.log("WebSocket game client connected");
    socket.on("message", (message: string) => {
            try {
                const msg: WSMessage = JSON.parse(message);

                switch (msg.type) {
                case "InitGameRequest":
                    processInitGameRequest(engine, socket, msg as InitGameRequest);
                    break;
                case "PlayerInput":
                    let scene = engine.scenes.find(scene => scene.id === msg.gameId);
                    if (scene) {
                        const paddle = msg.side === "left" ? scene.pongMeshes.paddleLeft : scene.pongMeshes.paddleRight;
                        scene.stopAnimation(paddle);
                        animatePaddleToX(paddle, paddle.position.z + PADDLE_STEP * msg.direction);
                    }
                    break;
                default:
                    console.error(`Bad WS message: ${msg}`);
                    // socket.send(`Bad WS message: ${msg}`);
                }
            }
            catch (e) {
                // socket.terminate();
                console.error(e, message);
            }
        });
    socket.on("close", () => {
    engine.removePlayerBySocket(socket);
      if (currentUser) {
        users.delete(currentUser.id);
        broadcastUserList();
      }
    });
  });

}


// export async function wsPagePlugin(server: FastifyInstance, options: WsGamePluginOptions) {
//     const { engine } = options;

//     server.get("/ws-page", { websocket: true }, (socket: WebSocket, _req: FastifyRequest) => {
//         console.log("WebSocket game client connected");

//         socket.on("message", (message: string) => {
//             try {
//                 const msg: WSMessage = JSON.parse(message);

//                 switch (msg.type) {
//                 case "InitGameRequest":
//                     processInitGameRequest(engine, socket, msg as InitGameRequest);
//                     break;
//                 case "PlayerInput":
//                     let scene = engine.scenes.find(scene => scene.id === msg.gameId);
//                     if (scene) {
//                         const paddle = msg.side === "left" ? scene.pongMeshes.paddleLeft : scene.pongMeshes.paddleRight;
//                         scene.stopAnimation(paddle);
//                         animatePaddleToX(paddle, paddle.position.z + PADDLE_STEP * msg.direction);
//                     }
//                     break;
//                 default:
//                     console.error(`Bad WS message: ${msg}`);
//                     // socket.send(`Bad WS message: ${msg}`);
//                 }
//             }
//             catch (e) {
//                 // socket.terminate();
//                 console.error(e, message);
//             }
//         });

//         socket.on("close", () => {
//             engine.removePlayerBySocket(socket);
//         });
//     });
// }

async function processInitGameRequest(engine: PongBackEngine, socket: WebSocket, msg: InitGameRequest): Promise<void> {
    // *Наташа: Старт логирования игры
    // const logId = await startGameLog(msg.user.id, msg.opponent.id);
    // (можно передать logId в сцену)

    console.log("Initializing game for player:", [msg.user.id], ", type : ", msg.gameType);

    engine.scenes.forEach(
        scene => scene.players.forEach(
            player => {
                if (player.id === msg.user.id || player.gameSocket === msg.user.gameSocket) {
                    console.error("User", [msg.user.id], "is already playing!");
                    return;
                }
            }
        )
    )

    switch (msg.gameType) {
        case "Local game":
            return await createLocalGame(engine, msg.user, socket);
        case "Remote game":
            return await createRemoteGame(engine, msg.user, socket);
        case "Versus AI":
            return await createAiGame(engine, msg.user, socket);
    }
}

async function createLocalGame(engine: PongBackEngine, player: User, socket: WebSocket) : Promise<void> {
    const game = new PongBackScene(engine);
    addPlayerToGame(game, player, socket);
    await game.enablePongPhysics();
    sendInitGameSuccess("Local game", game.id, assignSide(game), socket);
}

async function createRemoteGame(engine: PongBackEngine, newPlayer: User, socket: WebSocket) : Promise<void> {
    let game = engine.scenes.find(scene => scene.players.length === 1 && scene.state === "init");
    if (game) {
        addPlayerToGame(game, newPlayer, socket);
        await game.enablePongPhysics();
    }
    else {
        game = new PongBackScene(engine);
        addPlayerToGame(game, newPlayer, socket);
    }
    sendInitGameSuccess("Remote game", game.id, assignSide(game), socket);
}

async function createAiGame(engine: PongBackEngine, newPlayer: User, socket: WebSocket) : Promise<void> {
    const game = new PongBackScene(engine);
    addPlayerToGame(game, newPlayer, socket);
    addAiOpponent(game);
    await game.enablePongPhysics();
    sendInitGameSuccess("Versus AI", game.id, "left", socket);
}

function addPlayerToGame(game: PongBackScene, newPlayer: User, socket: WebSocket) : void {
    if (!game.players.find(player => player.id === newPlayer.id)) {
        newPlayer.gameSocket = socket;
        game.players.push(newPlayer);
    }
}

function assignSide(game: PongBackScene) : PlayerSide {
    if (game.players.length === 1)
        return "left";
    else if (game.players.length === 2)
        return "right";
    else
        throw error("Invalid number of players!");
}

function addAiOpponent(game: PongBackScene) : void {
    if (!game.aiOpponent)
        game.aiOpponent = new AIOpponent(game, "right");
}

function sendInitGameSuccess(inGameType: GameType, inGameId: GUID, inPlayerSide: PlayerSide, socket: WebSocket) {
    const response : InitGameSuccess = {
        type: "InitGameSuccess",
        gameType: inGameType,
        gameId: inGameId,
        gameState: "init",
        playerSide: inPlayerSide
    }

    socket.send(JSON.stringify(response));
}
