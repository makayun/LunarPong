import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import type { FastifyRequest } from "fastify";

export type ChatMessage =
  | { type: 'register'; id: string; name?: string }
  | { type: 'message'; to: string; from: string; content: string }
  | { type: 'block'; userId: string }
  | { type: 'unblock'; userId: string }
  | { type: 'invite'; to: string; game?: string }
  | { type: 'notify'; content: string }
  | { type: 'profile'; userId: string };

export type ChatUser = {
  id: string;
  name: string;
  socket: WebSocket;
  blocked: Set<string>;
};

const users: Map<string, ChatUser> = new Map();

function broadcastUserList() {
  const payload = JSON.stringify({
    type: 'userlist',
    users: Array.from(users.values()).map((u) => u.id),
  });
  for (const user of users.values()) {
    user.socket.send(payload);
  }
}

function sendToUser(userId: string, message: any) {
  const user = users.get(userId);
  if (user) {
    user.socket.send(JSON.stringify(message));
  }
}

export async function wsChatPlugin(server: FastifyInstance) {
  server.get("/ws-chat", { websocket: true }, (socket: WebSocket, _req: FastifyRequest) => {
    let currentUser: ChatUser | null = null;

    socket.on("message", (data: string) => {
      try {
        const msg: ChatMessage = JSON.parse(data.toString());

        switch (msg.type) {
          case 'register': {
            const id = msg.id;
            const name = msg.name || `User ${id}`;
            currentUser = { id, name, socket, blocked: new Set() };
            users.set(id, currentUser);
            socket.send(JSON.stringify({ type: 'system', content: `Welcome, ${name}` }));
            broadcastUserList();
            break;
          }

          case 'message': {
            if (!currentUser) return;
            const recipient = msg.to;
            const senderId = currentUser.id;

            if (recipient === 'all') {
              for (const user of users.values()) {
                if (user.id !== senderId && !user.blocked.has(senderId)) {
                  user.socket.send(JSON.stringify({
                    type: 'message',
                    from: senderId,
                    content: msg.content,
                  }));
                }
              }
            } else {
              sendToUser(recipient, {
                type: 'message',
                from: senderId,
                content: msg.content,
              });
            }
            break;
          }

          case 'block': {
            if (!currentUser) return;
            currentUser.blocked.add(msg.userId);
            break;
          }

          case 'unblock': {
            if (!currentUser) return;
            currentUser.blocked.delete(msg.userId);
            break;
          }

          case 'invite': {
            if (!currentUser) return;
            sendToUser(msg.to, {
              type: 'invite',
              from: currentUser.id,
              game: msg.game || 'pong',
            });
            break;
          }

          case 'notify': {
            if (!currentUser) return;
            for (const user of users.values()) {
              user.socket.send(JSON.stringify({ type: 'system', content: msg.content }));
            }
            break;
          }

          case 'profile': {
            if (!currentUser) return;
            console.log(`User ${currentUser.id} запросил профиль ${msg.userId}`);
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

// npx webpack --env mode=development
// npm start
