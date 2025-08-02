// import { getUserId } from '../helpers/helpers';

import { generateNickname } from "../helpers/helpers";


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
export let TournamentActive: boolean;

async function initCurrentUser(): Promise<void> {
  try {
    currentUser = nameInput.value.toString();
    console.log('Tournament system initialized with user :', currentUser);
  } catch (error) {
    console.error('Failed to get user ID:', error);
  }
}

const dialog = document.getElementById('tournamentDialog') as HTMLDivElement;
const createBtn = document.getElementById('createTournament') as HTMLButtonElement;
const closeBtn = document.getElementById('btn-close') as HTMLButtonElement;
const cancelBtn = document.getElementById('Cancel-btn') as HTMLButtonElement;
const form = document.getElementById('tournamentForm') as HTMLFormElement;
const nameInput = document.getElementById('tournamentName') as HTMLInputElement;
const createSubmitBtn = document.getElementById('createBtn') as HTMLButtonElement;
const playerOptions = document.querySelectorAll('.player-count-option') as NodeListOf<HTMLDivElement>;
const joinTournamentBtn = document.getElementById('joinTournament') as HTMLButtonElement;
const messagesContainer = document.getElementById('messages') as HTMLDivElement;

async function initTournamentDialog(): Promise<void> {


  if (!dialog || !createBtn || !closeBtn || !cancelBtn || !form || !nameInput || !createSubmitBtn) {
    console.error('Tournament dialog elements not found');
    return;
  }
  setupEventListeners();
}

function setupEventListeners(): void {
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

  nameInput.addEventListener('input', validateForm);
  form.addEventListener('submit', handleSubmitUpdated);
}

function openDialog(): void {
  dialog.classList.add('active');

  setTimeout(() => {
    nameInput.focus();
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
  initCurrentUser();
  const hasName = nameInput.value.trim().length > 0;
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
      
  createSubmitBtn.disabled = !(hasName && hasPlayerCount);
}

async function handleSubmitUpdated(e: Event): Promise<void> {
  e.preventDefault();

  if (!selectedPlayerCount || !currentUser) {
    console.error('Missing required data for tournament creation');
    return;
  }

  const tournamentData: Tournament = {
    id: Date.now().toString(),
    name: generateNickname(),
    playerCount: selectedPlayerCount,
    currentPlayers: [currentUser],
    status: 'waiting',
    createdBy: currentUser,
    createdAt: new Date()
  };

  tournaments.push(tournamentData);
  console.log('Tournament created:', tournamentData);
  TournamentActive = true;
  showSuccessMessage(tournamentData);

  displayChatMessage('system',
    `Tournament "${tournamentData.name}" created! You (${currentUser}) are automatically enrolled. Waiting for ${tournamentData.playerCount - 1} more players to join.`,
    'success'
  );

  setTimeout(() => {
    checkAndSuggestTournaments();
  }, 1000);

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
  nameInput.value = '';
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

async function joinSpecificTournament(tournamentId: string): Promise<void> {
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
    showTournamentBracket(tournament);
  }
}

async function initJoinTournament(): Promise<void> {
  if (!joinTournamentBtn) {
    console.error('Join tournament button not found');
    return;
  }

  joinTournamentBtn.addEventListener('click', handleJoinTournament);
}

async function handleJoinTournament(): Promise<void> {

  if (!currentUser) {
    await initCurrentUser();
  }
  displayTournamentStatus();
}

function displayTournamentStatus(): void {
  if (!hasActiveTournaments()) {
    displayChatMessage('system', 'No tournaments have been created yet. Create a new tournament to get started!', 'info');
    return;
  }

  const availableTournaments = tournaments.filter(t =>
    t.status === 'waiting' &&
    t.currentPlayers.length < t.playerCount &&
    !t.currentPlayers.includes(currentUser!)
  );

  if (availableTournaments.length === 0) {
    const waitingTournaments = getTournamentsByStatus('waiting');
    if (waitingTournaments.length > 0) {
      displayChatMessage('system', 'All available tournaments are either full or you are already participating in them.', 'info');
    } else {
      displayChatMessage('system', 'No tournaments available to join. Create a new tournament to get started!', 'info');
    }
  } else {
    displayChatMessage('system', `Found ${availableTournaments.length} tournament(s) available for ${currentUser}:`, 'info');

    availableTournaments.forEach(tournament => {
      displayTournamentOption(tournament);
    });
  }
}

function displayTournamentOption(tournament: Tournament): void {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'tournament-option-message';

  const tournamentInfo = document.createElement('div');
  tournamentInfo.className = 'tournament-info';
  tournamentInfo.innerHTML = `
    <div class="tournament-details">
      <strong>${tournament.name}</strong>
      <span class="player-count">${tournament.currentPlayers.length}/${tournament.playerCount} players</span>
      <small>Created by: ${tournament.createdBy}</small>
      <div class="current-players">Players: ${tournament.currentPlayers.join(', ')}</div>
    </div>
  `;

  const joinBtn = document.createElement('button');
  joinBtn.className = 'join-tournament-btn';
  joinBtn.textContent = 'Join';
  joinBtn.onclick = () => joinSpecificTournament(tournament.id);

  messageDiv.appendChild(tournamentInfo);
  messageDiv.appendChild(joinBtn);

  appendToChat(messageDiv);
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

function showTournamentBracket(tournament: Tournament): void {
  const bracketDiv = document.createElement('div');
  bracketDiv.className = 'tournament-bracket';

  bracketDiv.innerHTML = `
    <div class="bracket-header">
      <h3>Tournament Bracket: ${tournament.name}</h3>
      <p>All players registered with their game IDs</p>
    </div>
    <div class="bracket-players">
      ${tournament.currentPlayers.map((player, index) =>
        `<div class="bracket-player">Seed ${index + 1}: ${player}</div>`
      ).join('')}
    </div>
    <button class="start-tournament-btn" onclick="startTournament('${tournament.id}')">
      Start Tournament
    </button>
  `;

  appendToChat(bracketDiv);
}

async function startTournament(tournamentId: string): Promise<void> {
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) {
    displayChatMessage('system', 'Tournament not found!', 'error');
    return;
  }

  if (tournament.status !== 'full') {
    displayChatMessage('system', 'Tournament is not ready to start. Need more players!', 'warning');
    return;
  }

  tournament.status = 'active';

  displayChatMessage('system',
    `Tournament "${tournament.name}" has started! Players: ${tournament.currentPlayers.join(', ')}`,
    'success'
  );

}


async function updateCurrentUser(): Promise<void> {
  await initCurrentUser();
}

document.addEventListener('DOMContentLoaded', async () => {
  await initTournamentDialog();
  await initJoinTournament();

  setTimeout(() => {
    if (hasActiveTournaments()) {
      checkAndSuggestTournaments();
    }
  }, 500);
});

export {
    initTournamentDialog,
    initJoinTournament,
    joinSpecificTournament,
    hasActiveTournaments,
    checkAndSuggestTournaments,
    getTournamentsByStatus,
    updateCurrentUser,
    startTournament
};



// import { TournamentB } from "../back/tournament_back";
// import type { User } from "../defines/types";

// const player1: User = { id: 1, nick: "Anna", gameSocket: socket1 };
// const player2: User = { id: 2, nick: "Marivanna", gameSocket: socket2 };
// const player3: User = { id: 3, nick: "Dolboeb", gameSocket: socket3 };
// const player4: User = { id: 4, nick: "Bot", gameSocket: socket4 };

// const tournamentName = "Ultimate Battle";
// const tournament = new TournamentB(tournamentName);

// tournament.runTournament(player1, player2, player3, player4);
// /* prinimaem json s resultatom */
// tournament.handleGameOver(1, "Anna");
// /* prinimaem json s resultatom */
// tournament.handleGameOver(2, "Bot");
// /* prinimaem json s resultatom */
// tournament.handleGameOver(3, "Dolboeb");
// /* rassylka */
