import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import type { FastifyRequest } from "fastify";
import type { ChatMessage, User } from "../defines/types";
// import ActiveService from "./active_service";
// import UserSession from "./user_session";
import { TournamentService }	from './sqlib'

const TrnmntSrv = new TournamentService();

const users: Map<number, User> = new Map();

function broadcastUserList() {
  const payload = JSON.stringify({
    type: 'userlist',
    users: Array.from(users.values()).map((u) => ({ id: u.id, nick: u.nick })),
  });
  for (const user of users.values()) {
    user.chatSocket?.send(payload);
  }
}

function sendToUser(userId: number, message: any) {
  const user = users.get(userId);
  if (user?.chatSocket) {
    user.chatSocket.send(JSON.stringify(message));
  }
}

// export interface WsChatPluginOptions { users: User[]; activeService: ActiveService; };

// export async function wsChatPlugin(server: FastifyInstance, options: WsChatPluginOptions) {
export async function wsChatPlugin(server: FastifyInstance) {
  server.get("/ws-chat", { websocket: true }, (socket: WebSocket, _req: FastifyRequest) => {
    server.log.info("[CHAT] WebSocket connected");
    let currentUser: User | null = null;
	socket.isAlive = true;
    socket.on("message", (data: string) => {
      try {
        const msg: ChatMessage = JSON.parse(data.toString());

        switch (msg.type) {
			case "register": {
				// console.debug("Registering user in chat:", msg.user.id);
				// const userSessionIDX: number = options.activeService.getSessionIDX(msg.user.id)
				// console.debug(`User session index for ${msg.user.id} (socket_c):`, userSessionIDX);
				// if (userSessionIDX === -1) {
				// 	options.activeService.add(msg.user.id, undefined, socket);
				// 	console.log(`User ${msg.user.id} registered in ActiveService.`);
				// } else {
				// 	options.activeService.getSession(userSessionIDX)?.setSocketC(socket);
				// 	console.log(`User ${msg.user.id} is already active in ActiveService, just add the chat socket.`);
				// }
			// 	break;
            // case 'register': {
                const rawUser = msg.user;
                let nickname = (rawUser.nick && rawUser.nick.trim());
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
                blocked: new Set<number>(),
            };

            users.set(currentUser.id, currentUser);
            server.log.info(`[CHAT] Number of active users: ${users.size}`);
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

            const profile = TrnmntSrv.getProfile(msg.user.id);
            if (!profile) {
              socket.send(JSON.stringify({ 
                type: 'profile',
                code: 404,
                error: 'Profile not found'
              }));
              break;
            }
            socket.send(JSON.stringify({
              type: 'profile',
              code: 200,
              profile: profile
            }));
            break;
          }

          // case 'profile': {
          //   if (!currentUser) return;
          
          //   const requestedUser = users.get(msg.user.id);
          //   if (!requestedUser) {
          //     socket.send(JSON.stringify({
          //       type: 'profile',
          //       user: { id: msg.user.id },
          //       error: 'User not found'
          //     }));
          //     return;
          //   }

          //   // 💥💥💥Здесь должны быть реальные данные!
          //   socket.send(JSON.stringify({
          //     type: 'profile',
          //     user: {
          //       id: requestedUser.id,
          //       nick: requestedUser.nick
          //     },
          //     rating: 4.2,       // 💥💥💥Заглушка
          //     wins: 42,          // 💥💥💥Заглушка
          //     streak: 5          // 💥💥💥Заглушка
          //   }));
          //   break;
          // }

          default:
            console.warn("Unknown message type:", msg);
        }
      } catch (err) {
        socket.send(JSON.stringify({ type: 'system', content: 'Invalid message format.' }));
      }
    });

    socket.on("close", () => {
      if (currentUser) {
        server.log.info(`[CHAT] WebSocket disconnected, user: ${currentUser.nick}`);
        users.delete(currentUser.id);
        server.log.info(`[CHAT] Number of active users: ${users.size}`);
        broadcastUserList();
      }
    });

	socket.on("pong", () => {
		console.debug("Received pong from client (socket_c)");
		socket.isAlive = true;
	});
  });
}
