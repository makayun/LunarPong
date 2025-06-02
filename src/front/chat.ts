import { getOrCreateClientId, getOrCreateNickname } from "../helpers/helpers";
import type { GUID } from "../defines/types";

const input = document.getElementById('input') as HTMLInputElement;
const messages = document.getElementById('messages') as HTMLDivElement;
const recipient = document.getElementById('recipient') as HTMLSelectElement;
const socket = new WebSocket(`ws://${window.location.host}/ws-chat`);

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
    if (data.type === 'nick-confirm') {
      if (data.nick !== user.nick) {
        user.nick = data.nick;
        sessionStorage.setItem('pong-nickname', data.nick);
        addMessage(`[System] Your nickname was changed to ${data.nick} because the previous one was taken.`);
      }
    }
    switch (data.type) {
      case 'message': {
        let direction = 'all';
        if (data.to?.nick === user.nick) {
          direction = 'you';
        } else if (data.to?.nick) {
          direction = userMap.get(data.to.id as GUID) || data.to.id;
        }
        const fromNick = userMap.get(data.from as GUID) || data.from;
        addMessage(`[${fromNick} -> ${direction}] ${data.content}`);
        break;
      }
      case 'system':
        addMessage(`[System] ${data.content}`);
        break;
      case 'userlist':
        updateUserList(data.users);
        break;
      case 'invite':
        const fromNick = userMap.get(data.from as GUID) || data.from;
        addMessage(`[Invite] 🔧 ${fromNick} invited you to play ${data.game}`);
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
      const nick = recipient.value === 'all' ? 'all' : userMap.get(recipient.value as GUID);
      const direction = nick || recipient.value;
      console.log('Sending to:', { id: recipient.value, nick });
      addMessage(`[You -> ${direction}] ${text}`);
      input.value = '';
    }
  }
});

function addMessage(msg: string) {
  const div = document.createElement('div');
  div.className = 'message';
  div.textContent = msg;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

let userMap = new Map<GUID, string>();

function updateUserList(users: { id: GUID; nick: string }[]) {
  console.log('Received users:', users);
  userMap.clear();
  recipient.innerHTML = '<option value="all">All Players</option>';
  users.forEach((u) => {
    userMap.set(u.id, u.nick);
    if (u.nick !== user.nick) {
      const option = document.createElement('option');
      option.value = u.id;
      option.textContent = u.nick;
      recipient.appendChild(option);
    }
  });
  console.log('userMap after update:', Array.from(userMap.entries()));
}

export function blockUser() {
  const target = recipient.value;
  if (target !== 'all') {
    socket.send(JSON.stringify({ type: 'block', user: { id: target } }));
    const targetNick = userMap.get(target as GUID) || target;
    addMessage(`[System] 👿 Blocked user ${targetNick}`);
  }
}

export function inviteUser() {
  const recipientElement = document.getElementById('recipient') as HTMLSelectElement | null;
  if (!recipientElement) {
    console.error('Recipient element not found');
    return;
  }
  const target = recipientElement.value;
  if (target !== 'all') {
    socket.send(JSON.stringify({ type: 'invite', to: { id: target }, game: 'pong' }));
    const targetNick = userMap.get(target as GUID) || target;
    addMessage(`[System] Invited ${targetNick} to play pong`);
  }
}

export function viewProfile() {
  const target = recipient.value;
  if (target !== 'all') {
    const playerNick = userMap.get(target as GUID) || target;

    socket.send(JSON.stringify({
      type: 'profile',
      user: { id: target }
    }));

    const profileHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'profile' && data.user.id === target) {
          socket.removeEventListener('message', profileHandler);

          const profileHTML = `
            <div class="player-profile">
              <h3>🎮 ${playerNick}</h3>
              <p>⭐ Rating: ${data.rating || 'N/A'}</p>
              <p>🏆 Wins: ${data.wins || 0}</p>
              <p>🔥 Streak: ${data.streak || 0}</p>
            </div>
          `;

          const profileDiv = document.createElement('div');
          profileDiv.id = 'player-profile';
          profileDiv.innerHTML = profileHTML;
          messages.appendChild(profileDiv);
          messages.scrollTop = messages.scrollHeight;
        }
      } catch {}
    };

    socket.addEventListener('message', profileHandler);
  }
}

(window as any).blockUser = blockUser;
(window as any).inviteUser = inviteUser;
(window as any).viewProfile = viewProfile;
