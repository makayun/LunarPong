import { ViewState, navigateTo} from "./state"
import { user_f, login, twofa, logoff, validateToken} from "./login"

export function setDivLogin() {
	initLoginHandlers();
}

function initLoginHandlers() {
	const loginBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="login"]`);
	const loginInput = document.querySelector<HTMLInputElement>('.input[data-input-id="login_password"]');
	if(loginInput)
	{
		document.addEventListener('keydown', (e) => {
		const currentView = document.querySelector('[data-view-id="login"]:not(.hidden)');
    	if ((e.key) === "enter" && currentView) {
			login();
		}
		}); 
	}
	if (loginBtn) {
		loginBtn.addEventListener("click", async () => {
			console.log("[login] Login button clicked");
			login();
		});
	}
	const registerBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="login_register"]`);
	if (registerBtn) {
		registerBtn.addEventListener("click", () => {
			console.log("[login] Register button clicked");
			navigateTo(ViewState.REGISTER);
		}
	)};
}

export function setDiv2fa() {
	const el = document.querySelector('[data-i18n="logged.title"]');
	if (el) {
		el.setAttribute('data-i18n-args', JSON.stringify({ name: user_f.name, id: user_f.id }));
	}
	if (!validateToken("twofaToken"))  {
		navigateTo(ViewState.LOGIN);
		return;
	}
	// startCountdown(300, logoff);
	initLoggedHandlers();
}

function initLoggedHandlers() {
	const logoffBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="logoff"]`);
	const twofaInput = document.querySelector<HTMLInputElement>('.input[data-input-id="2fa_token"]');
	if (logoffBtn) {
		logoffBtn.addEventListener("click", async () => {
			logoff();
		}
	)};
	
	if(twofaInput)
	{
		document.addEventListener('keydown', (e) => {
		const currentView = document.querySelector('[data-view-id="2fa"]:not(.hidden)');
    	if ((e.key) === 'Enter' && currentView) {
			twofa();
		}
		}); 
	}
	const continueBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="2fa_continue"]`);
	if (continueBtn) {
		continueBtn.addEventListener("click", async () => {
			console.log("[logged] Continue button clicked:");
			twofa();
			// navigateTo(ViewState.GAME);
		}
	)};
}

export function setDivRegister() {
	initRegisterHandlers();
}

function initRegisterHandlers() {
	const continueBtn = document.querySelector(".register-btn");
	const backBtn = document.querySelector('.btn_click[data-btn-id="back"]') as HTMLButtonElement;
	if (backBtn) {
		backBtn.addEventListener("click", async () => {
			console.log("[register] Back button clicked");
			navigateTo(ViewState.LOGIN);
	})};
	if (continueBtn) {
		continueBtn.addEventListener("click", async () => {
			console.log("[register] Register button clicked:");
		}
	)};
}
