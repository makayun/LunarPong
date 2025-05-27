import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import type { FastifyRequest } from "fastify";
import type { ChatMessage, User, GUID } from "../defines/types";

const users: Map<GUID, User> = new Map();

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

export async function wsChatPlugin(server: FastifyInstance) {
  server.get("/ws-chat", { websocket: true }, (socket: WebSocket, _req: FastifyRequest) => {
    let currentUser: User | null = null;

    socket.on("message", (data: string) => {
      try {
        const msg: ChatMessage = JSON.parse(data.toString());

        switch (msg.type) {
            case 'register': {
                const rawUser = msg.user;
                const nickname = (rawUser.nick && rawUser.nick.trim()) || `User-${rawUser.id.slice(0, 6)}`;

                currentUser = {
                ...rawUser,
                nick: nickname,
                chatSocket: socket,
                blocked: new Set<GUID>(),
            };

            users.set(currentUser.id, currentUser);
            socket.send(JSON.stringify({ type: 'system', content: `Welcome, ${currentUser.nick}` }));
            broadcastUserList();
            break;
            }

        //   case 'register': {
        //     const user = msg.user;
        //     const nickname = (user.nick && user.nick.trim()) || `User ${user.id.slice(0, 6)}`;

        //     const blocked = new Set<GUID>();
        //     currentUser = {
        //       ...user,
        //       nick: nickname,
        //       chatSocket: socket,
        //       blocked,
        //     };
        //     users.set(user.id, currentUser);
        //     socket.send(JSON.stringify({ type: 'system', content: `Welcome, ${user.nick || user.id}` }));
        //     broadcastUserList();
        //     break;
        //   }

          case 'message': {
            if (!currentUser) return;
            const recipientId = msg.to.id;
            const senderId = currentUser.id;

            const recipient = users.get(recipientId);
            if (!recipient || recipient.blocked?.has(senderId)) return;

            recipient.chatSocket?.send(JSON.stringify({
              type: 'message',
              from: senderId,
              to: { id: recipientId },
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
            console.log(`User ${currentUser.id} запросил профиль ${msg.user.id}`);
            break;
          }

          default:
            console.warn("Unknown message type:", msg);
        }
      } catch (err) {
        socket.send(JSON.stringify({ type: 'system', content: 'Invalid message format.' }));
      }
    });

    socket.on("close", () => {
      if (currentUser) {
        users.delete(currentUser.id);
        broadcastUserList();
      }
    });
  });
}


