import { ViewState, showDiv, navigateTo} from "./history"
// import { user_f } from "./login"

export function setDivLogin() {
	initLoginHandlers();
}

function initLoginHandlers() {
	const loginBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="login"]`);
	if (loginBtn) {
		loginBtn.addEventListener("click", async () => {
			console.log("[login] Login button clicked:");
			const name = document.querySelector<HTMLElement>(`.data_input[data-input-id="login_name"]`) as HTMLInputElement;
			const password = document.querySelector<HTMLElement>(`.data_input[data-input-id="login_password"]`) as HTMLInputElement;

			if (!name.value || !password.value) {
				console.log("[login] login name or password empty");
				return;
			}

			try {
				const response = await fetch(`${window.location.origin}/api/login`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						username: name.value,
						password: password.value
					})
				});

				if (!response.ok) {
					const errorData = await response.json();
					console.error("[login] Login failed:", errorData.error);
					return;
				}

				const data = await response.json();
				console.log("[login] Login successful, accessToken:", data.accessToken);
				console.log("[login] Login successful, refreshToken:", data.refreshToken);

				// 💾 Сохраняем токены (в localStorage или sessionStorage)
				localStorage.setItem("accessToken", data.accessToken);
				localStorage.setItem("refreshToken", data.refreshToken);
				navigateTo(ViewState.TWOFA);
			} catch (err) {
				console.error("[login] Network error:", err);
			}
		});
	}
	const registerBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="login_register"]`);
	if (registerBtn) {
		registerBtn.addEventListener("click", async () => {
			console.log("[register] Register button clicked:");
			navigateTo(ViewState.REGISTER);
		}
	)};
}

export function setDiv2fa() {
	const el = document.querySelector('[data-i18n="logged.title"]');
	if (el) {
		el.setAttribute('data-i18n-args', JSON.stringify({ name: sessionStorage.getItem("name"), id: sessionStorage.getItem("id") }));
	}
	initLoggedHandlers();
}

function initLoggedHandlers() {
	const loginBtn = document.querySelector(".logoff-btn");
	if (loginBtn) {
		loginBtn.addEventListener("click", async () => {
			console.log("[logoff] Login button clicked:");
			showDiv("div_logoff", false);
			navigateTo(ViewState.LOGIN);
		}
	)};
	const continueBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="2fa_continue"]`);
	if (continueBtn) {
		continueBtn.addEventListener("click", async () => {
			console.log("[logged] Continue button clicked:");
			navigateTo(ViewState.GAME);
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
