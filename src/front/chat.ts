import type { User_f } from "../defines/types";
import '../styles/output.css';

const input = document.getElementById('chat-input') as HTMLInputElement;
const messages = document.getElementById('messages') as HTMLDivElement;
const recipient = document.getElementById('recipient') as HTMLSelectElement;
var		socket: WebSocket;

window.addEventListener("pongLogin", (e: CustomEventInit<User_f>) => {
  const inId = e.detail?.id;
  const inNick = e.detail?.name;
  if (inId && inNick) {
    const user = {
      id: inId,
			nick: inNick,
		}
    let userMap = new Map<number, string>();
    if (!socket || socket.readyState != socket.OPEN)
      socket = new WebSocket(`wss://${window.location.host}/ws-chat`);
    window.addEventListener("pongLogoff", () => { socket.close(); })

    socket.addEventListener('open', () => {
		console.debug("WebSocket (socket_c) connection established.");
    	socket.send(JSON.stringify({ type: 'register', user }));
    });

    // !!!!!!!!!!
    window.addEventListener("t_start", (e: CustomEventInit<string>) => {
      addMessage("Tournament " + e.detail + " has been created");
    })
    // !!!!!!!!!!

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
              direction = userMap.get(data.to.id) || data.to.id;
            }
            const fromNick = userMap.get(data.from) || data.from;
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
            const fromNick = userMap.get(data.from) || data.from;
            addMessage(`[Invite] ${fromNick} invited you to play ${data.game} 👤🏓👤`);
          break;
        }
      } catch {
        addMessage(event.data);
      }
    });

    function updateUserList(users: { id: number; nick: string }[]) {
      console.log('Received users:', users);
      userMap.clear();
      recipient.innerHTML = '<option value="all">👥</option>';
      users.forEach((u) => {
        userMap.set(u.id, u.nick);
        if (u.nick !== user.nick) {
          const option = document.createElement('option');
          option.value = u.id.toString();
          option.textContent = u.nick;
          recipient.appendChild(option);
        }
      });
      console.log('userMap after update:', Array.from(userMap.entries()));
    }

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
              to: { id: Number(recipient.value) }, // <-- convert to number
              content: text,
            };
          }
          socket.send(JSON.stringify(payload));
          const nick = recipient.value === 'all' ? 'all' : userMap.get(Number(recipient.value));
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



    function blockUser() {
      const target = recipient.value;
      if (target !== 'all') {
        socket.send(JSON.stringify({ type: 'block', user: { id: Number(target) } })); // <-- convert to number
        const targetNick = userMap.get(Number(target)) || target;
        addMessage(`[System] 👿 Blocked user ${targetNick}`);
      }
    }

    function inviteUser() {
      const recipientElement = document.getElementById('recipient') as HTMLSelectElement | null;
      if (!recipientElement) {
        console.error('Recipient element not found');
        return;
      }
      const target = recipientElement.value;
      if (target !== 'all') {
        socket.send(JSON.stringify({ type: 'invite', to: { id: Number(target) }, game: 'pong' })); // <-- convert to number
        const targetNick = userMap.get(Number(target)) || target;
        addMessage(`[System] Invited ${targetNick} to play pong`);
      }
    }

    function viewProfile() {
      let target = recipient.value;
      let playerNick: string;
      if (target !== 'all') {
        playerNick = userMap.get(Number(target)) || target;
      } else {
        if (!inId || !inNick) {
          console.error('No user ID or nickname available for profile view');
          return;
        }
        target = inId.toString();
        playerNick = inNick;
      }

        socket.send(JSON.stringify({
          type: 'profile',
          user: { id: Number(target) } // <-- convert to number
        }));

        const profileHandler = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'profile' && data.code === 200) {
              socket.removeEventListener('message', profileHandler);
              console.log('Profile data received:', data.profile);
              const profileHTML = `
                <div class="player-profile">
                  <hr>
                  <h3>🎮 Profile: ${playerNick}</h3>
                  <p>🏅 Position: ${data.profile.position}</p>
                  <p>🕹️ Games: ${data.profile.games}</p>
                  <p>🏆 Wins: ${data.profile.wins}</p>
                  <p>⭐ Score: ${data.profile.score}</p>
                  <hr>
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
      // }
    }

    (window as any).blockUser = blockUser;
    (window as any).inviteUser = inviteUser;
    (window as any).viewProfile = viewProfile;
  }
})
