




const availableGames = [
  { id: 1, playerName: "Alex_Gaming", status: "Waiting for opponent", ping: "25ms" },
  { id: 2, playerName: "ProPlayer_42", status: "Ready to play", ping: "18ms" },
  { id: 3, playerName: "LunarMaster", status: "Looking for match", ping: "34ms" },
  { id: 4, playerName: "PongChampion", status: "Waiting", ping: "12ms" },
  { id: 5, playerName: "SpaceAce", status: "Ready", ping: "28ms" }
];




let selectedGameId: number | null = null;



const remoteGameBtn = document.getElementById("Remote game") as HTMLButtonElement;
const remoteGameDialog = document.getElementById("remoteGameDialog") as HTMLDialogElement;
const joinGameDialog = document.getElementById("joinGameDialog") as HTMLElement;
const successDialog = document.getElementById("successDialog") as HTMLElement;
const modalBackdrop = document.getElementById("modalBackdrop") as HTMLElement;

const createGameBtn = document.getElementById("createGameBtn") as HTMLButtonElement;
const joinGameBtn = document.getElementById("joinGameBtn") as HTMLButtonElement;
const remoteGameCancel = document.getElementById("remoteGameCancel") as HTMLButtonElement;
const joinGameCancel = document.getElementById("joinGameCancel") as HTMLButtonElement;
const joinSelectedGame = document.getElementById("joinSelectedGame") as HTMLButtonElement;
const successOk = document.getElementById("successOk") as HTMLButtonElement;

// Show modal function with proper typing
function showModal(dialog: HTMLElement): void {
  if (modalBackdrop) {
    modalBackdrop.classList.remove("hidden");
  }
  dialog.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

// Hide modal function with proper typing
function hideModal(dialog: HTMLElement): void {
  if (modalBackdrop) {
    modalBackdrop.classList.add("hidden");
  }
  dialog.classList.add("hidden");
  document.body.style.overflow = "auto";
}

// Remote game button click
if (remoteGameBtn) {
  remoteGameBtn.addEventListener("click", () => {
    showModal(remoteGameDialog);
  });
}

// Create game button click
if (createGameBtn) {
  createGameBtn.addEventListener("click", () => {
    hideModal(remoteGameDialog);
    
    // Simulate game creation
    const gameId = Math.floor(Math.random() * 10000);
    const successMessage = document.getElementById("successMessage") as HTMLElement;
    if (successMessage) {
      successMessage.innerHTML = `
        <h3 style="margin-bottom: 0.5rem;">🎮 Game Created Successfully!</h3>
        <p>Game ID: <strong>${gameId}</strong></p>
        <p>Waiting for players to join...</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Share this Game ID with other players!</p>
      `;
    }
    
    showModal(successDialog);
  });
}

// Join game button click
if (joinGameBtn) {
  joinGameBtn.addEventListener("click", () => {
    hideModal(remoteGameDialog);
    populateAvailableGames();
    showModal(joinGameDialog);
  });
}

// Populate available games
function populateAvailableGames(): void {
  const container = document.getElementById("availableGames") as HTMLElement;
  if (!container) return;

  container.innerHTML = "";

  if (availableGames.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #9ca3af; padding: 2rem;">
        <p>No games available at the moment.</p>
        <p style="font-size: 0.9rem;">Try creating a new game instead!</p>
      </div>
    `;
    return;
  }

  availableGames.forEach(game => {
    const gameItem = document.createElement("div");
    gameItem.className = "game-item";
    gameItem.dataset.gameId = game.id.toString(); // Convert number to string
    
    gameItem.innerHTML = `
      <div class="player-name">${game.playerName}</div>
      <div class="game-status">${game.status} • Ping: ${game.ping}</div>
    `;
    
    gameItem.addEventListener("click", () => selectGame(game.id));
    container.appendChild(gameItem);
  });
}

// Select game function with proper typing
function selectGame(gameId: number): void {
    
  // Remove previous selection
  document.querySelectorAll(".game-item").forEach(item => {
    item.classList.remove("selected");
  });
  
  // Add selection to clicked item
  const selectedItem = document.querySelector(`[data-game-id="${gameId}"]`) as HTMLElement;
  if (selectedItem) {
    selectedItem.classList.add("selected");
  }
  
  selectedGameId = gameId;
  if (joinSelectedGame) {
    joinSelectedGame.disabled = false;
  }
}

// Join selected game
if (joinSelectedGame) {
  joinSelectedGame.addEventListener("click", () => {
    if (!selectedGameId) return;
    
    const selectedGame = availableGames.find(game => game.id === selectedGameId);
    if (!selectedGame) return;
    
    hideModal(joinGameDialog);
    
    const successMessage = document.getElementById("successMessage") as HTMLElement;
    if (successMessage) {
      successMessage.innerHTML = `
        <h3 style="margin-bottom: 0.5rem;">🔗 Joined Game Successfully!</h3>
        <p>Connected to: <strong>${selectedGame.playerName}</strong></p>
        <p>Ping: ${selectedGame.ping}</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Game will start shortly...</p>
      `;
    }
    
    showModal(successDialog);
  });
}

// Cancel buttons
if (remoteGameCancel) {
    
  remoteGameCancel.addEventListener("click", async () => {
    hideModal(remoteGameDialog);

  });
}

if (joinGameCancel) {
  joinGameCancel.addEventListener("click", () => {
    hideModal(joinGameDialog);
    selectedGameId = null;
    if (joinSelectedGame) {
      joinSelectedGame.disabled = true;
    }
    showModal(remoteGameDialog);
  });
}

if (successOk) {
  successOk.addEventListener("click", () => {
    hideModal(successDialog);
  });
}

// Close modals when clicking backdrop
if (modalBackdrop) {
  modalBackdrop.addEventListener("click", () => {
    hideModal(remoteGameDialog);
    hideModal(joinGameDialog);
    hideModal(successDialog);
    selectedGameId = null;
    if (joinSelectedGame) {
      joinSelectedGame.disabled = true;
    }
  });
}

// Prevent modal close when clicking inside dialog
document.querySelectorAll(".remote-game-content, .join-game-content").forEach(content => {
  content.addEventListener("click", (e: Event) => {
    e.stopPropagation();
  });
});

// Simulate real-time updates (optional)
setInterval(() => {
  // Randomly update game statuses
  availableGames.forEach(game => {
    const statuses = ["Waiting for opponent", "Ready to play", "Looking for match", "Waiting", "Ready"];
    if (Math.random() < 0.1) { // 10% chance to update
      game.status = statuses[Math.floor(Math.random() * statuses.length)];
    }
  });
  
  // Re-populate if join dialog is open
  if (joinGameDialog && !joinGameDialog.classList.contains("hidden")) {
    const currentSelected = selectedGameId;
    populateAvailableGames();
    if (currentSelected) {
      selectGame(currentSelected);
    }
  }
}, 3000);