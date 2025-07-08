import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import type { FastifyRequest } from "fastify";
import type { ChatMessage, User, GUID } from "../defines/types";

const users: Map<GUID, User> = new Map();
const duplicateSessions: Map<GUID, WebSocket[]> = new Map();

function broadcastUserList() {
  const payload = JSON.stringify({
    type: 'userlist',
    users: Array.from(users.values()).map((u) => ({ id: u.id, nick: u.nick })),
  });
  for (const user of users.values()) {
    user.chatSocket?.send(payload);
  }
}

function promoteFirstDuplicateSession(userId: GUID) {
  const duplicates = duplicateSessions.get(userId);
  if (duplicates && duplicates.length > 0) {
    const firstDuplicate = duplicates.shift();
    
    if (firstDuplicate && firstDuplicate.readyState === WebSocket.OPEN) {

      const user = users.get(userId);
      firstDuplicate.send(JSON.stringify({
        type: 'session-activated',
        nick: user?.nick || 'Unknown',
        message: 'You are now the active session'
      }));
      
      if (duplicates.length === 0) {
        duplicateSessions.delete(userId);
      }
      
      return firstDuplicate;
    } else {
      return promoteFirstDuplicateSession(userId);
    }
  }
  return null;
}

function sendToUser(userId: GUID, message: any) {
  const user = users.get(userId);
  if (user?.chatSocket) {
    user.chatSocket.send(JSON.stringify(message));
  }
}

function handleChatMessage(socket: WebSocket, msg: ChatMessage, currentUser: User | null) {
  switch (msg.type) {
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

      socket.send(JSON.stringify({
        type: 'profile',
        user: {
          id: requestedUser.id,
          nick: requestedUser.nick
        },
        rating: 4.2,
        wins: 42,
        streak: 5
      }));
      break;
    }

    default:
      console.warn("Unknown message type:", msg);
  }
}


function setupSocketHandlers(socket: WebSocket, userId: GUID) {
  const user = users.get(userId);
  if (!user) return;


  socket.removeAllListeners('message');
  socket.removeAllListeners('close');

  socket.on("message", (data: string) => {
    try {
      const msg: ChatMessage = JSON.parse(data.toString());
      handleChatMessage(socket, msg, user);
    } catch (err) {
      socket.send(JSON.stringify({ type: 'system', content: 'Invalid message format.' }));
    }
  });

  socket.on("close", () => {
    const newActiveSocket = promoteFirstDuplicateSession(userId);
    
    if (newActiveSocket) {
      user.chatSocket = newActiveSocket;
      
      setupSocketHandlers(newActiveSocket, userId);
      
      newActiveSocket.send(JSON.stringify({
        type: 'system',
        content: `You are now the active session for ${user.nick}`
      }));
      broadcastUserList();
    } else {
      users.delete(userId);
      duplicateSessions.delete(userId);
      broadcastUserList();
    }
  });
}

export async function wsChatPlugin(server: FastifyInstance) {
  server.get("/ws-chat", { websocket: true }, (socket: WebSocket, _req: FastifyRequest) => {
    let currentUser: User | null = null;
    let isDuplicateSession = false;

    socket.on("message", (data: string) => {
      try {
        const msg: ChatMessage = JSON.parse(data.toString());

        switch (msg.type) {
          case 'register': {
            const rawUser = msg.user;
            let nickname = (rawUser.nick && rawUser.nick.trim()) || `User-${rawUser.id.slice(0, 6)}`;

            const existingUser = users.get(rawUser.id);
            if (existingUser) {
              if (!duplicateSessions.has(rawUser.id)) {
                duplicateSessions.set(rawUser.id, []);
              }
              duplicateSessions.get(rawUser.id)!.push(socket);
              
              isDuplicateSession = true;
              
              socket.send(JSON.stringify({
                type: 'system',
                content: `User is already logged in from another location. You cannot perform any actions until the other session is closed.`,
              }));
        
              socket.send(JSON.stringify({
                type: 'duplicate-session',
                message: 'user already logged in from another location',
                readonly: true
              }));
              
              try {
                existingUser.chatSocket?.send(JSON.stringify({
                  type: 'system',
                  content: `Someone tried to log in with your account from another location.`,
                }));
              } catch (e) {
                console.warn("Error notifying original user:", e);
              }
              return;
            }

            isDuplicateSession = false;
            const isNickTaken = Array.from(users.values()).some(u => u.nick === nickname);
            if (isNickTaken) {
              let suffix = 1;
              let newNick: string;
              do {
                newNick = `${nickname}_${suffix++}`;
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
            socket.send(JSON.stringify({ type: 'nick-confirm', nick: currentUser.nick }));
            broadcastUserList();
            setupSocketHandlers(socket, currentUser.id);
            break;
          }

          default:
            if (currentUser) {
              handleChatMessage(socket, msg, currentUser);
            }
        }
      } catch (err) {
        socket.send(JSON.stringify({ type: 'system', content: 'Invalid message format.' }));
      }
    });

    socket.on("close", () => {
      if (currentUser && !isDuplicateSession) {
        const newActiveSocket = promoteFirstDuplicateSession(currentUser.id);
        if (newActiveSocket) {
          currentUser.chatSocket = newActiveSocket;
          setupSocketHandlers(newActiveSocket, currentUser.id); // promoted socket
          newActiveSocket.send(JSON.stringify({
            type: 'system',
            content: `You are now the active session for ${currentUser.nick}`
          }));
          broadcastUserList();
        } else {
          users.delete(currentUser.id);
          duplicateSessions.delete(currentUser.id);
          broadcastUserList();
        }
      } else if (isDuplicateSession && currentUser) {
        const duplicates = duplicateSessions.get(currentUser.id);
        if (duplicates) {
          const index = duplicates.indexOf(socket);
          if (index > -1) {
            duplicates.splice(index, 1);
          }
          if (duplicates.length === 0) {
            duplicateSessions.delete(currentUser.id);
          }
        }
      }
    });
  });
}