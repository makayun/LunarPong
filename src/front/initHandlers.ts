import { login, logoff, twofa, register } from "./login"
import { ViewState, navigateTo } from "./state"

export function initHandlers() {
	const loginInput = document.querySelector<HTMLElement>('.input[data-input-id="login_password"]');
	if(loginInput)
	{
		document.addEventListener("keyup", async (e) => {
		const currentView = document.querySelector('[data-view-id="login"]:not(.hidden)');
		if (currentView && (e.key === "Enter" || e.key === "NumpadEnter")) {
			console.debug("[LOGIN] Enter key pressed");
			login();
		}
		});
	}

	const loginBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="login"]`);
	if (loginBtn) {
		loginBtn.addEventListener("click", async () => {
			console.debug("[LOGIN] Button clicked");
			login();
		});
	}

	const twofaInput = document.querySelector<HTMLInputElement>('.input[data-input-id="2fa_token"]');
	if(twofaInput)
	{
		document.addEventListener("keyup", async (e) => {
		const currentView = document.querySelector('[data-view-id="2fa"]:not(.hidden)');
		if (currentView && (e.key === "Enter" || e.key === "NumpadEnter")) {
			console.debug("[2FA] Enter key pressed");
			twofa();
		}
		});
	}

	const continueBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="2fa_continue"]`);
	if (continueBtn) {
		continueBtn.addEventListener("click", async () => {
			console.debug("[2FA] Button clicked");
			twofa();
		}
	)};

	const login_registerBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="login_register"]`);
	if (login_registerBtn) {
		login_registerBtn.addEventListener("click", () => {
			console.debug("[LOGIN] Register button clicked");
			navigateTo(ViewState.REGISTER);
		}
	)};

	const registerBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="register"]`);
	if (registerBtn) {
		registerBtn.addEventListener("click", () => {
			console.debug("[REGISTER] Button clicked");
			register();
		}
	)};

	const logoffBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="logoff"]`);
	if (logoffBtn) {
		logoffBtn.addEventListener("click", async () => {
			console.debug("[LOGOFF] Button clicked:");
			logoff();
		}
	)};
}
