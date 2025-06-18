import { ViewState, navigateTo} from "./history"
import { user_f, login, twofa, logoff, startCountdown} from "./login"

export function setDivLogin() {
	initLoginHandlers();
}

function initLoginHandlers() {
	const loginBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="login"]`);
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
	startCountdown(300, logoff);
	initLoggedHandlers();
}

function initLoggedHandlers() {
	const logoffBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="logoff"]`);
	if (logoffBtn) {
		logoffBtn.addEventListener("click", async () => {
			logoff();
		}
	)};
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
	if (continueBtn) {
		continueBtn.addEventListener("click", async () => {
			console.log("[register] Register button clicked:");
		}
	)};
}
