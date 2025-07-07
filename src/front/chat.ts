import { getUserId, getUserNickname } from "../helpers/helpers";
import type { GUID } from "../defines/types";
// import '../styles/styles.css';
import '../styles/output.css';

const input = document.getElementById('chat-input') as HTMLInputElement;
const messages = document.getElementById('messages') as HTMLDivElement;
const recipient = document.getElementById('recipient') as HTMLSelectElement;
const socket = new WebSocket(`wss://${window.location.host}/ws-chat`);

let isDuplicateSession = false;
let userMap = new Map<GUID, string>();

async function chatMain() {
  let user = {
    id: await getUserId(),
    nick: await getUserNickname()
  };
  
  const logoffBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="logoff"]`);
	if (logoffBtn) {
		logoffBtn.addEventListener("click", async function() {
			user = { id: await getUserId(), nick: await getUserNickname() }
		})
	}

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'register', user }));
    // addMessage(`[System] You are ${user.nick}`);
  });

  socket.addEventListener('message', (event) => {
    console.log('Received:', event.data);
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'duplicate-session') {
        isDuplicateSession = true;
        disableUserInterface();
        showDuplicateSessionWarning();
        return;
      }
      
      if (data.type === 'session-activated') {
        isDuplicateSession = false;
        enableUserInterface();
        showSessionReactivatedMessage();
        sessionStorage.setItem('pong-nickname', data.nick);
        return;
      }
      
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
          addMessage(`[Invite] ${fromNick} invited you to play ${data.game} 👤🏓👤`);
          break;
      }
    } catch {
      addMessage(event.data);
    }
  });

  function updateUserList(users: { id: GUID; nick: string }[]) {
    console.log('Received users:', users);
    userMap.clear();
    recipient.innerHTML = '<option value="all">👥</option>';
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

  function handleInputKeydown(e: KeyboardEvent) {
    
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
  }
  input.addEventListener('keydown', handleInputKeydown);

  (window as any).handleInputKeydown = handleInputKeydown;
}

function addMessage(msg: string) {
  const div = document.createElement('div');
  div.className = 'message';
  div.textContent = msg;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function blockUser() {
  if (isDuplicateSession) {
    showActionBlockedMessage();
    return;
  }
  
  const target = recipient.value;
  if (target !== 'all') {
    socket.send(JSON.stringify({ type: 'block', user: { id: target } }));
    const targetNick = userMap.get(target as GUID) || target;
    addMessage(`[System] 👿 Blocked user ${targetNick}`);
  }
}

function inviteUser() {
  if (isDuplicateSession) {
    showActionBlockedMessage();
    return;
  }
  
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

function viewProfile() {
  
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
              <button id="joinTournament"
                class="game-button-tw">
                Join Tournament
              </button>
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

function disableUserInterface() {
  if (input) {
    input.disabled = true;
    input.placeholder = "Chat disabled - User logged in elsewhere";
    input.style.backgroundColor = '#f5f5f5';
    input.style.color = '#999';
  }
  
  if (recipient) {
    recipient.disabled = true;
    recipient.style.backgroundColor = '#f5f5f5';
    recipient.style.color = '#999';
  }
  
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    const buttonElement = button as HTMLButtonElement;
    if (buttonElement.onclick || buttonElement.getAttribute('onclick')) {
      buttonElement.disabled = true;
      buttonElement.style.backgroundColor = '#f5f5f5';
      buttonElement.style.color = '#999';
      buttonElement.style.cursor = 'not-allowed';
    }
  });
  addDisabledOverlay();
}

function showDuplicateSessionWarning() {
  const warningDiv = document.createElement('div');
  warningDiv.id = 'duplicate-session-warning';
  warningDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff4444;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideDown 0.3s ease-out;
    ">
      This account is already logged in from another location. 
      <br>You can view messages but cannot perform any actions.
      <br><small>Close the other session to regain control.</small>
    </div>
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(warningDiv);
  setTimeout(() => {
    if (warningDiv.parentNode) {
      warningDiv.parentNode.removeChild(warningDiv);
    }
  }, 5000);
  addMessage(`[System] DUPLICATE SESSION DETECTED - Interface disabled. This account is logged in elsewhere.`);
}

function addDisabledOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'disabled-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.1);
      z-index: 500;
      pointer-events: none;
    "></div>
  `;
  document.body.appendChild(overlay);
  
}

function enableUserInterface() {

  if (input) {
    input.disabled = false;
    input.placeholder = "Type your message...";
    input.style.backgroundColor = '';
    input.style.color = '';
    
    input.focus();
  }
  

  if (recipient) {
    recipient.disabled = false;
    recipient.style.backgroundColor = '';
    recipient.style.color = '';
  }
  

  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    const buttonElement = button as HTMLButtonElement;
    if (buttonElement.disabled) {
      buttonElement.disabled = false;
      buttonElement.style.backgroundColor = '';
      buttonElement.style.color = '';
      buttonElement.style.cursor = '';
    }
  });
  
  const overlay = document.getElementById('disabled-overlay');
  if (overlay) {
    overlay.remove();
  }
  
  const warning = document.getElementById('duplicate-session-warning');
  if (warning) {
    warning.remove();
  }
  
  if ((window as any).handleInputKeydown) {
    input.removeEventListener('keydown', (window as any).handleInputKeydown);
    input.addEventListener('keydown', (window as any).handleInputKeydown);
  }
}

function showSessionReactivatedMessage() {
  const successDiv = document.createElement('div');
  successDiv.id = 'session-reactivated-banner';
  successDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #28a745;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideDown 0.3s ease-out;
    ">
      Session reactivated! You can now perform actions again.
    </div>
  `;
  
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.parentNode.removeChild(successDiv);
    }
  }, 5000);
  addMessage(`[System] SESSION REACTIVATED - You are now the active session and can perform actions.`);
}

function showActionBlockedMessage() {
  addMessage(`[System] Action blocked: User already logged in from another location.`);
  
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ff4444;
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    font-weight: bold;
    z-index: 1001;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  popup.textContent = 'Action blocked - User logged in elsewhere';
  document.body.appendChild(popup);
  
  setTimeout(() => {
    if (popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }
  }, 3000);
}

(window as any).blockUser = blockUser;
(window as any).inviteUser = inviteUser;
(window as any).viewProfile = viewProfile;

chatMain();