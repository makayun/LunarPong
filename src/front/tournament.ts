import { generateNickname } from "../helpers/helpers";
import { user/*, socket*/ } from './game'
import '../styles/output.css';
import {  initGameButtons, setGameButtons, unsetGameButtons } from "./gameButtons";
import type { User_f } from "../defines/types";
interface Tournament {
  id: string;
  name: string;
  playerCount: number;
  currentPlayers: string[];
  status: 'waiting' | 'full' | 'active' | 'completed';
  createdBy: string;
  createdAt: Date;
}

let selectedPlayerCount: number | null = null;
let tournaments: Tournament[] = [];
let currentUser: string | null = null;
export let TournamentActive: boolean = false; // нужна ли инициализация????

const dialog = document.getElementById('tournamentDialog') as HTMLDivElement;
const createBtn = document.getElementById('createTournament') as HTMLButtonElement;
const closeBtn = document.getElementById('btn-close') as HTMLButtonElement;
const cancelBtn = document.getElementById('Cancel-btn') as HTMLButtonElement;
const form = document.getElementById('tournamentForm') as HTMLFormElement;
const player1 = document.getElementById('player1') as HTMLInputElement;
const player2 = document.getElementById('player2') as HTMLInputElement;
const player3 = document.getElementById('player3') as HTMLInputElement;
const createSubmitBtn = document.getElementById('createBtn') as HTMLButtonElement;
const playerOptions = document.querySelectorAll('.player-count-option') as NodeListOf<HTMLDivElement>;
const messagesContainer = document.getElementById('messages') as HTMLDivElement;

const	gameButtons = initGameButtons();

export async function initTournamentDialog(socket: WebSocket): Promise<void> {


  if (!dialog || !createBtn || !closeBtn || !cancelBtn || !form ||!createSubmitBtn) {
    console.error('Tournament dialog elements not found');
    return;
  }
  setupEventListeners(socket);
}

function setupEventListeners(socket: WebSocket): void {
  createBtn.addEventListener('click', openDialog);
  closeBtn.addEventListener('click', closeDialog);
  cancelBtn.addEventListener('click', (e: MouseEvent) => {
    if (e.target === cancelBtn) {
      if (!user || !user.id || !user.nick) {
      console.error("No valid user available!", user);
      displayChatMessage('system', 'Error: No user logged in!', 'error');
      return;
      }  
      setGameButtons(gameButtons,socket, user);
      closeDialog();
    }
  });

  // dialog.addEventListener('click', (e: MouseEvent) => {
  //   if (e.target === dialog) {
  //     if (!user || !user.id || !user.nick) {
  //     console.error("No valid user available!", user);
  //     displayChatMessage('system', 'Error: No user logged in!', 'error');
  //     return;
  //     }  
  //     setGameButtons(gameButtons,socket, user);
  //     closeDialog();
  //   }
  // });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    
    if (e.key === 'Escape' && dialog.classList.contains('active')) {
      if (!user || !user.id || !user.nick) {
      console.error("No valid user available!", user);
      displayChatMessage('system', 'Error: No user logged in!', 'error');
      return;
      }  
      setGameButtons(gameButtons,socket, user);
      closeDialog();
    }
  });
  playerOptions.forEach((option: HTMLDivElement) => {
    option.addEventListener('click', () => selectPlayerCount(option));

    option.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPlayerCount(option);
      }
    });

    option.setAttribute('tabindex', '0');
  });

  player1.addEventListener('input', validateForm);
  player2.addEventListener('input', validateForm);
  player3.addEventListener('input', validateForm);
  
  form.addEventListener("submit", (e) => handleSubmitUpdated(socket,e));
}

function openDialog(): void {
  dialog.classList.add('active');

  setTimeout(() => {
    
    player2.focus();
    player3.focus();
    player1.focus();
  }, 300);
}

function closeDialog(): void {
  dialog.classList.remove('active');

  setTimeout(() => {
    resetForm();
  }, 300);
}

function selectPlayerCount(option: HTMLDivElement): void {
  playerOptions.forEach((opt: HTMLDivElement) => {
    opt.classList.remove('selected');
  });

  option.classList.add('selected');

  const players = option.dataset.players;
  selectedPlayerCount = players ? parseInt(players) : null;

  validateForm();
}

function validateForm(): void {
  // initCurrentUser();
  const hasName1 = player1.value.trim().length > 0;
  const hasName2 = player1.value.trim().length > 0;
  const hasName3 = player1.value.trim().length > 0;
  const hasPlayerCount = selectedPlayerCount !== null;
  if(TournamentActive)
  {
    displayChatMessage('system',
    `You cannot create new tournament until active is not finished`,
    'error'
  );
  dialog.classList.remove('active');

  setTimeout(() => {
    resetForm();
  }, 300);
  }
      
  createSubmitBtn.disabled = !(hasName1 && hasName2 && hasName3 &&  hasPlayerCount);
}

async function handleSubmitUpdated(socket: WebSocket,e: Event): Promise<void> {
  e.preventDefault();

  const player1 = document.getElementById('player1') as HTMLInputElement;
  const player2 = document.getElementById('player2') as HTMLInputElement;
  const player3 = document.getElementById('player3') as HTMLInputElement;

  if (!player1.value || !player2.value || !player3.value) {
    console.error('Missing required data for tournament creation');
    showNotificationMessage('All player name fields must be filled!');
    return;
  }

  const players = [
    player1.value.trim(),
    player2.value.trim(),
    player3.value.trim()
  ];

  const uniquePlayers = new Set(players);
  if (uniquePlayers.size !== 3) {
    console.error('Player names must be unique');
    showNotificationMessage('Player names must be unique!');
    return;
  }

  const tournamentData: Tournament = {
    id: Date.now().toString(),
    name: generateNickname(),
    playerCount: 3,
    currentPlayers: players,
    status: 'full',
    createdBy: "someone",
    createdAt: new Date()
  };

  tournaments.push(tournamentData);
  console.log('Tournament created:', tournamentData);
  TournamentActive = true;
  showSuccessMessage(tournamentData);

  displayChatMessage('system',
    `Tournament "${tournamentData.name}" created!`,
    'success'
  );

  showTournamentBracket(socket,tournamentData);

  closeDialog();
}

function showNotificationMessage(message: string): void {
  const successDiv = document.createElement('div');
  successDiv.className = `
  fixed top-5 right-5 z-[2000]
  text-white font-semibold font-mono
  px-6 py-4 rounded-2xl
  border-2 border-[--color-blue]
  backdrop-blur-md
  bg-[rgba(0,0,0,0.9)]
  shadow-[0_0_6px_var(--color-white)]
  transform translate-x-full
  transition-transform duration-300 ease-out
  pointer-events-none
`;

  successDiv.textContent = message;

  document.body.appendChild(successDiv);

  setTimeout(() => {
    successDiv.classList.remove('translate-x-full');
    successDiv.classList.add('translate-x-0');
  }, 100);

  setTimeout(() => {
    successDiv.classList.add('translate-x-full');
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 300);
  }, 3000);
}

function showSuccessMessage(data: { name: string; playerCount: number }): void {
  const successDiv = document.createElement('div');
  successDiv.className = `
  fixed top-5 right-5 z-[2000]
  text-white font-semibold font-mono
  px-6 py-4 rounded-2xl
  border-2 border-[--color-blue]
  backdrop-blur-md
  bg-[rgba(0,0,0,0.9)]
  shadow-[0_0_6px_var(--color-white)]
  transform translate-x-full
  transition-transform duration-300 ease-out
  pointer-events-none
`;
  successDiv.textContent = `Tournament "${data.name}" created for ${data.playerCount} players!`;

  document.body.appendChild(successDiv);

  setTimeout(() => {
    successDiv.classList.remove('translate-x-full');
    successDiv.classList.add('translate-x-0');
  }, 100);

  setTimeout(() => {
    successDiv.classList.add('translate-x-full');
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 300);
  }, 3000);
}

function resetForm(): void {
  player1.value = '';
  player2.value = '';
  player3.value = '';
  selectedPlayerCount = null;

  playerOptions.forEach((opt: HTMLDivElement) => {
    opt.classList.remove('selected');
  });

  createSubmitBtn.disabled = true;
}

function appendToChat(element: HTMLElement): void {
  if (!messagesContainer) return;

  messagesContainer.appendChild(element);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function checkAndSuggestTournaments(): void {
  const waitingTournaments = tournaments.filter(t =>
    t.status === 'waiting' &&
    t.currentPlayers.length < t.playerCount
  );

  if (waitingTournaments.length > 0) {
    displayChatMessage('system',
      `${waitingTournaments.length} tournament(s) waiting for players. Click "Join Tournament" to see available options!`,
      'info'
    );
  }
}

function hasActiveTournaments(): boolean {
  return tournaments.length > 0;
}

function getTournamentsByStatus(status: Tournament['status']): Tournament[] {
  return tournaments.filter(t => t.status === status);
}

async function joinSpecificTournament(socket: WebSocket,tournamentId: string): Promise<void> {
  if (!currentUser) {
    console.error('No current user set');
    displayChatMessage('system', 'User not initialized. Please refresh the page.', 'error');
    return;
  }

  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) {
    displayChatMessage('system', 'Tournament not found!', 'error');
    return;
  }

  if (tournament.currentPlayers.includes(currentUser)) {
    displayChatMessage('system', `You (${currentUser}) are already in this tournament!`, 'warning');
    return;
  }

  if (tournament.currentPlayers.length >= tournament.playerCount) {
    displayChatMessage('system', 'Tournament is full!', 'error');
    return;
  }

  tournament.currentPlayers.push(currentUser);

  if (tournament.currentPlayers.length === tournament.playerCount) {
    tournament.status = 'full';
  }

  displayChatMessage('system',
    `Successfully joined "${tournament.name}" as ${currentUser}! (${tournament.currentPlayers.length}/${tournament.playerCount} players)`,
    'success'
  );

  if (tournament.status === 'full') {
    displayChatMessage('system',
      `Tournament "${tournament.name}" is now full and ready to start!`,
      'success'
    );
    showTournamentBracket(socket,tournament);
  }
}

function displayChatMessage(sender: string, message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${type}-message`;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  messageDiv.innerHTML = `
    <div class="message-header">
      <span class="sender">${sender}</span>
      <span class="timestamp">${timestamp}</span>
    </div>
    <div class="message-content">${message}</div>
  `;

  appendToChat(messageDiv);
}

function showTournamentBracket(socket: WebSocket,tournament: Tournament): void {
  const bracketDiv = document.createElement('div');
  bracketDiv.className = 'tournament-bracket';


  const players = tournament.currentPlayers;
  const matches = [
    { player1: players[0], player2: players[1] },
    { player1: players[1], player2: players[2] },
    { player1: players[2], player2: players[0] }
  ];

  bracketDiv.innerHTML = `
    <div class="bracket-header">
      <h3>Tournament Bracket: ${tournament.name}</h3>
    </div>
    <div class="tournament-matches">
      <h4>Match Schedule:</h4>
      ${matches.map((match, index) =>
        `<div class="match-info">
          <strong>Match ${index + 1}:</strong> ${match.player1} vs ${match.player2}
        </div>`
      ).join('')}
    </div>
    <button class="start-tournament-btn">Start Tournament</button>
  `;

  appendToChat(bracketDiv);

  const btn = bracketDiv.querySelector('.start-tournament-btn');
  console.log('Button found:', btn);
  if (btn) {
    btn.addEventListener('click', () => startTournamentWithCountdown(socket,tournament.id, matches));
  }
}

async function startTournamentWithCountdown(socket: WebSocket,tournamentId: string, matches: Array<{player1: string, player2: string}>): Promise<void> {
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) {
    displayChatMessage('system', 'Tournament not found!', 'error');
    return;
  }
  if (tournament.status !== 'full') {
    displayChatMessage('system', 'Tournament is not ready to start. Need more players!', 'warning');
    return;
  }

  console.log('Tournament found:', tournament);
  console.log('Status before:', tournament.status);
  tournament.status = 'active';
  console.log('Status after set to active:', tournament.status);

  console.log('Status after countdown:', tournament.status);

  startRoundsWithEventListener(socket,tournament, matches);
  console.log('Status after startRounds:', tournament.status);
}

function showCountdown(): Promise<void> {
  return new Promise((resolve) => {
    let countdown = 5;
    
    const countdownDiv = document.createElement('div');
    countdownDiv.className = 'countdown-message';
    countdownDiv.innerHTML = `
      <div class="countdown-content">
        <h3>Tournament Starting In:</h3>
        <div class="countdown-number">${countdown}</div>
        <p>Get ready for the match!</p>
      </div>
    `;

    appendToChat(countdownDiv);

    const countdownInterval = setInterval(() => {
      countdown--;
      const numberElement = countdownDiv.querySelector('.countdown-number') as HTMLElement;
      if (numberElement) {
        numberElement.textContent = countdown.toString();
        
        if (countdown <= 3) {
          numberElement.style.color = '#ff4757';
          numberElement.style.transform = 'scale(1.2)';
          setTimeout(() => {
            numberElement.style.transform = 'scale(1)';
          }, 300);
        }
      }

      if (countdown <= 0) {
        clearInterval(countdownInterval);
        
        if (numberElement) {
          numberElement.textContent = 'START!';
          numberElement.style.color = '#2ed573';
          numberElement.style.transform = 'scale(1.5)';
        }
        
        setTimeout(() => {
          resolve();
        }, 1000);
      }
    }, 1000);
  });
}

function startRoundsWithEventListener(socket: WebSocket, tournament: Tournament, matches: Array<{player1: string, player2: string}>): void {
  if (!user || !user.id || !user.nick) {
    console.error("No user logged in");
    return;
  } 
  
  const tournamentUser: User_f = { id: user.id, name: user.nick };
  
  displayChatMessage('system',
    `🎮 Tournament "${tournament.name}" has started! 🎮`,
    'success'
  );

  const scores: Record<string, number> = {};
  let currentMatchIndex = 0;

  (tournament as any).matches = matches;

  function tournamentMessageHandler(event: MessageEvent) {
    try {
      const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      
      if (data.type === "GameOver") {
        const [score1, score2] = data.finalScore;
        const match = matches[currentMatchIndex];
        const winner = score1 > score2 ? match.player1 : match.player2;

        scores[winner] = (scores[winner] || 0) + 1;
        currentMatchIndex++;
        console.log("Index++:", currentMatchIndex, "Data:", data);
        if (currentMatchIndex >= matches.length) {
          displayWinners();
          socket.removeEventListener('message', tournamentMessageHandler);
          TournamentActive = false;
          return;
        }
        unsetGameButtons(gameButtons, "Local game");
        displayChatMessage('system', `🏁 Game over! Winner: ${winner}`, 'success');
        
        playNextMatch();
      }
    } catch (e) {
      console.error("Parse error:", e);
    }
  }

  socket.addEventListener('message', tournamentMessageHandler);

  async function playNextMatch(): Promise<void> {
    const match = matches[currentMatchIndex];

    displayChatMessage('system',
      `🥊 MATCH ${currentMatchIndex + 1}: ${match.player1} vs ${match.player2}`,
      'info'
    );
    await showCountdown();
    if (!user || !user.id || !user.nick) {
      console.error("No valid user available!", user);
      displayChatMessage('system', 'Error: No user logged in!', 'error');
      return;
    }    

    window.dispatchEvent(new CustomEvent('pongLogin', { detail: tournamentUser }));
    unsetGameButtons(gameButtons, "Local game");
    console.log("Tournament game WS connected");
    try {
      socket.send(JSON.stringify({
        type: "InitGameRequest",
        gameType: "Local game",
        user: { id: user.id, name: user.nick },
      }));
      console.log("InitGameRequest sent");
    } catch (e) {
      console.error("Send error:", e);
    }
  }

  function displayWinners(): void {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    
    displayChatMessage('system', '🏆 TOURNAMENT COMPLETE! 🏆', 'success');
    displayChatMessage('system', '📊 Final Scores:', 'success');
    
    for (const [player, wins] of sorted) {
      const medal = wins === 0 ? '🥉' : wins === 1 ? '🥈' : '🥇';
      displayChatMessage('system', `${medal} ${player}: ${wins} wins`, 'info');
    };

    if (sorted.length > 0) {
      displayChatMessage('system', `👑 Champion: ${sorted[0][0]}! 👑`, 'success');
    }
  }
  
  playNextMatch();
}

// ======================================================

async function startTournament(socket: WebSocket,tournamentId: string): Promise<void> {
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) {
    displayChatMessage('system', 'Tournament not found!', 'error');
    return;
  }

  const players = tournament.currentPlayers;
  const matches = [
    { player1: players[0], player2: players[1] },
    { player1: players[1], player2: players[2] },
    { player1: players[2], player2: players[0] }
  ];

  await startTournamentWithCountdown(socket,tournamentId, matches);
}

export {
    joinSpecificTournament,
    hasActiveTournaments,
    checkAndSuggestTournaments,
    getTournamentsByStatus,
    startTournament
};
