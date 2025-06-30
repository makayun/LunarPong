
let selectedPlayerCount: number | null = null;


const dialog = document.getElementById('tournamentDialog') as HTMLDivElement;
const createBtn = document.getElementById('createTournament') as HTMLButtonElement;
const closeBtn = document.getElementById('btn-close') as HTMLButtonElement;
const cancelBtn = document.getElementById('Cancel-btn') as HTMLButtonElement;
const form = document.getElementById('tournamentForm') as HTMLFormElement;
const nameInput = document.getElementById('tournamentName') as HTMLInputElement;
const createSubmitBtn = document.getElementById('createBtn') as HTMLButtonElement;
const playerOptions = document.querySelectorAll('.player-count-option') as NodeListOf<HTMLDivElement>;


function initTournamentDialog(): void {
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
  
  form.addEventListener('submit', handleSubmit);
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
  const hasName = nameInput.value.trim().length > 0;
  const hasPlayerCount = selectedPlayerCount !== null;
  
  createSubmitBtn.disabled = !(hasName && hasPlayerCount);
}

function handleSubmit(e: Event): void {
  e.preventDefault();
  
  if (!selectedPlayerCount) return;
  
  const tournamentData = {
    name: nameInput.value.trim(),
    playerCount: selectedPlayerCount
  };
  
  console.log('Tournament created:', tournamentData);
  
  showSuccessMessage(tournamentData);
  
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

document.addEventListener('DOMContentLoaded', () => {
  initTournamentDialog();
});

export {
  initTournamentDialog,
  openDialog,
  closeDialog,
  resetForm
};