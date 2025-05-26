import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import type { FastifyRequest } from "fastify";
import type { ChatMessage, User, GUID } from "../defines/types";

export interface WsChatPluginOptions { 
    users: Map<GUID, User> 
};

const users = new Map<GUID, User>();

function broadcastUserList() {
    const payload = JSON.stringify({
        type: 'userlist',
        users: Array.from(users.values()).map((u) => u.id),
    });
    for (const user of users.values()) {
        user.chatSocket?.send(payload);
    }
}

function sendToUser(userId: GUID, message: ChatMessage) {
    const user = users.get(userId);
    if (user && user.chatSocket) {
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
                        currentUser = msg.user;
                        currentUser.chatSocket = socket;
                        users.set(currentUser.id, currentUser);
                        socket.send(JSON.stringify({ 
                            type: 'notify', 
                            content: `Welcome, ${currentUser.nick || currentUser.id}` 
                        }));
                        broadcastUserList();
                        break;
                    }

                    case 'message': {
                        if (!currentUser) return;
                        
                        if ('broadcast' in msg) {
                            // Handle broadcast message
                            for (const user of users.values()) {
                                if (user.id !== currentUser.id && 
                                    !user.blocked?.has(currentUser.id) && 
                                    user.chatSocket) {
                                    user.chatSocket.send(JSON.stringify({
                                        type: 'message',
                                        content: msg.content
                                    }));
                                }
                            }
                        } else {
                            // Handle direct message
                            if (!msg.to.chatSocket) return;
                            if (msg.to.blocked?.has(currentUser.id)) return;
                            
                            msg.to.chatSocket.send(JSON.stringify({
                                type: 'message',
                                content: msg.content
                            }));
                        }
                        break;
                    }

                    case 'block': {
                        if (!currentUser) return;
                        if (!currentUser.blocked) {
                            currentUser.blocked = new Set();
                        }
                        currentUser.blocked.add(msg.user.id);
                        break;
                    }

                    case 'unblock': {
                        if (!currentUser?.blocked) return;
                        currentUser.blocked.delete(msg.user.id);
                        break;
                    }

                    case 'invite': {
                        if (!currentUser) return;
                        if (msg.to.chatSocket) {
                            msg.to.chatSocket.send(JSON.stringify({
                                type: 'invite',
                                to: msg.to,
                                game: msg.game
                            }));
                        }
                        break;
                    }

                    case 'notify': {
                        for (const user of users.values()) {
                            if (user.chatSocket) {
                                user.chatSocket.send(JSON.stringify({ 
                                    type: 'notify', 
                                    content: msg.content 
                                }));
                            }
                        }
                        break;
                    }

                    case 'profile': {
                        if (!currentUser) return;
                        console.log(`User ${currentUser.id} requested profile of ${msg.user.id}`);
                        break;
                    }

                    default:
                        console.warn("Unknown message type:", (msg as any).type);
                }
            } catch (err) {
                socket.send(JSON.stringify({ 
                    type: 'notify', 
                    content: 'Invalid message format.' 
                }));
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
