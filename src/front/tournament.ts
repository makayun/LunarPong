export function initializeEventListeners() {
    const openBtn = document.querySelector('createTournament') as HTMLButtonElement ;
    if(openBtn)
    {
        openBtn.addEventListener('click', openDialog);
    }
}

export function openDialog() {
    const dialog = document.querySelector('tournamentDialog') as HTMLElement;
    if (dialog) {
        dialog.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}