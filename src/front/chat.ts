import { getOrCreateClientId, getOrCreateNickname } from "../helpers/helpers";
// import type { GUID } from "../defines/types";

const input = document.getElementById('input') as HTMLInputElement;
const messages = document.getElementById('messages') as HTMLDivElement;
const recipient = document.getElementById('recipient') as HTMLSelectElement;
const socket = new WebSocket('ws://localhost:12800/ws-chat');

const user = {
  id: getOrCreateClientId(),
  nick: getOrCreateNickname(),
};

socket.addEventListener('open', () => {
  socket.send(JSON.stringify({ type: 'register', user }));
  addMessage(`[System] You are ${user.nick}`);
});

socket.addEventListener('message', (event) => {
  console.log('Received:', event.data);
  try {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case 'message': {
        let direction = 'all';
        if (data.to?.nick === user.nick) {
          direction = 'you';
        } else if (data.to?.nick) {
          direction = data.to.nick;
        }
        addMessage(`[${data.from} -> ${direction}] ${data.content}`);
        break;
      }
      case 'system':
        addMessage(`[System] ${data.content}`);
        break;
      case 'userlist':
        updateUserList(data.users); // now: [{ id, nick }]
        break;
      case 'invite':
        addMessage(`[Invite] ${data.from} invited you to play ${data.game}`);
        break;
    }
  } catch {
    addMessage(event.data);
  }
});

input.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    const text = input.value.trim();
    if (text !== '') {
      let payload;
      if (recipient.value === 'all') {
        payload = {
          type: 'broadcast',
          content: text,
        };
      } else {
        payload = {
          type: 'message',
          to: { id: recipient.value },
          content: text,
        };
      }
      socket.send(JSON.stringify(payload));
      const direction = recipient.value === 'all' ? 'all' : recipient.value;
      addMessage(`[You -> ${direction}] ${text}`);
      input.value = '';
    }
  }
});

function addMessage(msg: string) {
  messages.textContent += msg + '\n';
  messages.scrollTop = messages.scrollHeight;
}

let userMap = new Map<string, string>(); // id -> nick

function updateUserList(users: { id: string; nick: string }[]) {
  userMap.clear();
  recipient.innerHTML = '<option value="all">Broadcast</option>';
  users.forEach((u) => {
    userMap.set(u.id, u.nick);
    if (u.nick !== user.nick) {
      const option = document.createElement('option');
      option.value = u.id;
      option.textContent = u.nick;
      recipient.appendChild(option);
    }
  });
}

export function blockUser() {
  const target = recipient.value;
  if (target !== 'all') {
    socket.send(JSON.stringify({ type: 'block', user: { id: target } }));
    addMessage(`[System] Blocked user ${target}`);
  }
}

export function inviteUser() {
  const target = recipient.value;
  if (target !== 'all') {
    socket.send(JSON.stringify({ type: 'invite', to: { id: target }, game: 'pong' }));
    addMessage(`[System] Invited user ${target} to play pong`);
  }
}

export function viewProfile() {
  const target = recipient.value;
  if (target !== 'all') {
    alert(`Open profile of user ${target}`);
  }
}

(window as any).blockUser = blockUser;
(window as any).inviteUser = inviteUser;
(window as any).viewProfile = viewProfile;
