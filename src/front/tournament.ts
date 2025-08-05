// import { getUserId } from '../helpers/helpers';
import { generateNickname } from "../helpers/helpers";
import { User_f } from "../defines/types";

import '../styles/output.css';
// import { Engine } from "@babylonjs/core/Engines/engine";
// import { PongFrontScene } from "../scenes/PongFrontScene";

// const tournamentCanvas = document.createElement('canvas');
// tournamentCanvas.id = 'tournamentCanvas';
// document.body.appendChild(tournamentCanvas);

// const tournamentEngine = new Engine(tournamentCanvas, true);
// const tournamentScene = new PongFrontScene(tournamentEngine);

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
// let socket: WebSocket | null = null;
export let TournamentActive: boolean;

// async function initCurrentUser(): Promise<void> {
//   try {
//     currentUser = nameInput.value.toString();
//     console.log('Tournament system initialized with user :', currentUser);
//   } catch (error) {
//     console.error('Failed to get user ID:', error);
//   }
// }

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
  cancelBtn.addEventListener('click', closeDialog);

  dialog.addEventListener('click', (e: MouseEvent) => {
    if (e.target === dialog) {
      closeDialog();
    }
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && dialog.classList.contains('active')) {
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
    player1.focus();
    player2.focus();
    player3.focus();
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
    displayChatMessage('system', 'All player name fields must be filled!', 'error');
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
    displayChatMessage('system', 'Player names must be unique!', 'error');
    return;
  }

  // if (!selectedPlayerCount || !currentUser) {
  //   console.error('Missing required data for tournament creation');
  //   return;
  // }

  const tournamentData: Tournament = {
    id: Date.now().toString(),
    name: generateNickname(),
    playerCount: 3/*selectedPlayerCount*/,
    currentPlayers: players,
    status: 'full'/*'waiting'*/,
    createdBy: "someone",
    createdAt: new Date()
  };

  tournaments.push(tournamentData);
  console.log('Tournament created:', tournamentData);
  TournamentActive = true;
  showSuccessMessage(tournamentData);

  displayChatMessage('system',
    `Tournament "${tournamentData.name}" created!` /*You (${currentUser}) are automatically enrolled. Waiting for ${tournamentData.playerCount - 1} more players to join.`*/,
    'success'
  );

  // setTimeout(() => {
  //   checkAndSuggestTournaments();
  // }, 1000);

  showTournamentBracket(socket,tournamentData);

  closeDialog();
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



// async function handleJoinTournament(socket: WebSocket): Promise<void> {

//   // if (!currentUser) {
//   //   await initCurrentUser();
//   // }
//   displayTournamentStatus(socket);
// }

// function displayTournamentStatus(socket: WebSocket): void {
//   if (!hasActiveTournaments()) {
//     displayChatMessage('system', 'No tournaments have been created yet. Create a new tournament to get started!', 'info');
//     return;
//   }

//   const availableTournaments = tournaments.filter(t =>
//     t.status === 'waiting' &&
//     t.currentPlayers.length < t.playerCount &&
//     !t.currentPlayers.includes(currentUser!)
//   );

//   if (availableTournaments.length === 0) {
//     const waitingTournaments = getTournamentsByStatus('waiting');
//     if (waitingTournaments.length > 0) {
//       displayChatMessage('system', 'All available tournaments are either full or you are already participating in them.', 'info');
//     } else {
//       displayChatMessage('system', 'No tournaments available to join. Create a new tournament to get started!', 'info');
//     }
//   } else {
//     displayChatMessage('system', `Found ${availableTournaments.length} tournament(s) available for ${currentUser}:`, 'info');

//     availableTournaments.forEach(tournament => {
//       displayTournamentOption(socket,tournament);
//     });
//   }
// }

// function displayTournamentOption(socket: WebSocket,tournament: Tournament): void {
//   const messageDiv = document.createElement('div');
//   messageDiv.className = 'tournament-option-message';

//   const tournamentInfo = document.createElement('div');
//   tournamentInfo.className = 'tournament-info';
//   tournamentInfo.innerHTML = `
//     <div class="tournament-details">
//       <strong>${tournament.name}</strong>
//       <span class="player-count">${tournament.currentPlayers.length}/${tournament.playerCount} players</span>
//       <small>Created by: ${tournament.createdBy}</small>
//       <div class="current-players">Players: ${tournament.currentPlayers.join(', ')}</div>
//     </div>
//   `;

//   const joinBtn = document.createElement('button');
//   joinBtn.className = 'join-tournament-btn';
//   joinBtn.textContent = 'Join';
//   joinBtn.onclick = () => joinSpecificTournament(socket,tournament.id);

//   messageDiv.appendChild(tournamentInfo);
//   messageDiv.appendChild(joinBtn);

//   appendToChat(messageDiv);
// }

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

  // const btn = bracketDiv.querySelector('.start-tournament-btn');
  // if (btn) {
  //   btn.addEventListener('click', () => startTournament(tournament.id));
  // }
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

  await showCountdown();
  console.log('Status after countdown:', tournament.status);

  startFirstRound(socket,tournament, matches);
  console.log('Status after startFirstRound:', tournament.status);
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
        <p>Get ready for the first match!</p>
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

function startFirstRound(socket: WebSocket,tournament: Tournament, matches: Array<{player1: string, player2: string}>): void {
  displayChatMessage('system',
    `🎮 Tournament "${tournament.name}" has started! 🎮`,
    'success'
  );

  displayChatMessage('system',
    `🥊 FIRST MATCH: ${matches[0].player1} vs ${matches[0].player2}`,
    'info'
  );

  displayChatMessage('system',
    `Players ${matches[0].player1} and ${matches[0].player2}, prepare for battle!`,
    'info'
  );

  (tournament as any).matches = matches;
  (tournament as any).currentMatchIndex = 0;
  
  const tournamentUser: User_f = {
    id: Date.now(),
    name: matches[0].player1,
  };

  window.dispatchEvent(new CustomEvent('pongLogin', { detail: tournamentUser }));



  console.log("Tournament game WS connected");
  socket.send(JSON.stringify({
      type: "InitGameRequest",
      gameType: "Local game",
      user: tournamentUser,
    }));

  socket.onerror = (err) => {
    console.error("Tournament WS error:", err);
  };
}

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

// function advanceToNextMatch(socket: WebSocket ,tournamentId: string): void {
//   const tournament = tournaments.find(t => t.id === tournamentId) as any;
  
//   if (!tournament || !tournament.matches) {
//     displayChatMessage('system', 'Tournament data not found!', 'error');
//     return;
//   }

//   tournament.currentMatchIndex++;

//   if (tournament.currentMatchIndex >= tournament.matches.length) {
//     // Tournament completed
//     tournament.status = 'completed';
//     TournamentActive = false;
//     displayChatMessage('system',
//       `🏆 Tournament "${tournament.name}" has been completed! 🏆`,
//       'success'
//     );
//     return;
//   }

//   // Start next match
//   const nextMatch = tournament.matches[tournament.currentMatchIndex];
//   displayChatMessage('system',
//     `🥊 NEXT MATCH: ${nextMatch.player1} vs ${nextMatch.player2}`,
//     'info'
//   );

//   socket.send(JSON.stringify({
//     type: "InitGameRequest",
//     gameType: "Tournament",
//     user: currentUser,
//     tournamentId: tournament.id,
//     currentMatch: {
//       matchIndex: tournament.currentMatchIndex,
//       player1: nextMatch.player1,
//       player2: nextMatch.player2
//     }
//   }));
// }

// async function updateCurrentUser(): Promise<void> {
//   await initCurrentUser();
// }

// document.addEventListener('DOMContentLoaded', async () => {
//   await initTournamentDialog();

//   setTimeout(() => {
//     if (hasActiveTournaments()) {
//       checkAndSuggestTournaments();
//     }
//   }, 500);
// });


// document.addEventListener('DOMContentLoaded', async () => {
//   await initTournamentDialog();
//   await initJoinTournament();

//   setTimeout(() => {
//     if (hasActiveTournaments()) {
//       checkAndSuggestTournaments();
//     }
//   }, 500);
// });

export {
    joinSpecificTournament,
    hasActiveTournaments,
    checkAndSuggestTournaments,
    getTournamentsByStatus,
    // updateCurrentUser,
    startTournament
};