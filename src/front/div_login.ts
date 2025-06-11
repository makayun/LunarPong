import { updateI18nContent } from "./i18next"
import { div_main } from "./login"

const  div_login: string = '<h1 id="login_title" data-i18n="login.title"></h1> \
  <p><input type="text" id="login_name" data-i18n="login.name" class="input"/></p> \
  <p><input type="password" id="login_password" class="input"/></p> \
  <button class="login-btn" id="login_button" data-i18n="login.button"></button>';

export const  div_registration: string = "registration";

export function setDivLogin(div: HTMLDivElement) {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  div.innerHTML = div_login;
  updateI18nContent();
  initLoginHandlers();
}

function initLoginHandlers() {
	const loginBtn = document.querySelector(".login-btn");
	if (loginBtn) {
		loginBtn.addEventListener("click", async () => {
			console.log("[login] Login button clicked:");

			const login_name = document.getElementById('login_name') as HTMLInputElement;
			const login_password = document.getElementById('login_password') as HTMLInputElement;

			if (!login_name.value || !login_password.value) {
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
						username: login_name.value,
						password: login_password.value
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
				setDivLogged(div_main, data);
			} catch (err) {
				console.error("[login] Network error:", err);
			}
		});
	}
}

const  div_logged: string = '<h1 id="logged_title" data-i18n="logged.title"></h1> \
  <button class="logoff-btn" id="logoff_button" data-i18n="logoff.button"></button>';

export function setDivLogged(div: HTMLDivElement, data: any) {
  div.innerHTML = div_logged;
  const el = document.querySelector('[data-i18n="logged.title"]');
  if (el) {
    el.setAttribute('data-i18n-args', JSON.stringify({ name: data.user.username, id: data.user.id }));
  }
  updateI18nContent();
  initLoggedHandlers();
}

function initLoggedHandlers() {
	const loginBtn = document.querySelector(".logoff-btn");
	if (loginBtn) {
		loginBtn.addEventListener("click", async () => {
			console.log("[logoff] Login button clicked:");
			setDivLogin(div_main);		
		}
	)};
}
