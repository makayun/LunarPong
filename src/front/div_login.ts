// import { updateI18nContent } from "./i18next"
import { div_main_state, div_main, showDiv, set_div_main} from "./history"
import { user_f } from "./login"

const  div_login: string = '<h1 id="login_title" data-i18n="login.title"></h1> \
  <label for "name" data-i18n="login.label_name"> </label> <input class="input" type="text" id="name" data-i18n="login.name" class="input"/> <br> \
  <label for "password" data-i18n="login.label_password"> </label> <input type="password" id="password" class="input"/> <br> \
  <button  id="login-btn" data-i18n="login.button" class="login-btn"></button> <br> \
  <p data-i18n="or"> <\p> \
  <h1 class="register-button" id="logged_google">Здесь будет GOOGLE авторизация!</h1> \
  <p data-i18n="or"> <\p> \
  <button  id="register-btn" data-i18n="register.button" class="register-button"></button>';

export function setDivLogin() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  div_main.innerHTML = div_login;
//   updateI18nContent();
  initLoginHandlers();
}

function initLoginHandlers() {
	const loginBtn = document.querySelector("#login-btn");
	if (loginBtn) {
		loginBtn.addEventListener("click", async () => {
			console.log("[login] Login button clicked:");

			const name = document.getElementById('name') as HTMLInputElement;
			const password = document.getElementById('password') as HTMLInputElement;

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
				set_div_main(div_main_state.TWOFA);
				// setDivLogged();
			} catch (err) {
				console.error("[login] Network error:", err);
			}
		});
	}
	const registerBtn = document.querySelector("#register-btn");
	if (registerBtn) {
		registerBtn.addEventListener("click", async () => {
			console.log("[register] Register button clicked:");
			set_div_main(div_main_state.REGISTER);
			// setDivRegister(div_main);
		}
	)};
}

const  div_logged: string = '<h1 class="logged_in" id="logged_title" data-i18n="logged.title"></h1> \
  <h1 class="logged_in" id="logged_2FA">Здесь будет 2FA авторизация!</h1> \
  <button class="continue-btn" id="continue_button" data-i18n="continue"></button>';

export function setDiv2FA() {
  div_main.innerHTML = div_logged;
  const el = document.querySelector('[data-i18n="logged.title"]');
  if (el) {
    el.setAttribute('data-i18n-args', JSON.stringify({ name: user_f.name, id: user_f.id }));
  }
  showDiv("div_logoff", true);
//   updateI18nContent();
  initLoggedHandlers();
}

function initLoggedHandlers() {
	const loginBtn = document.querySelector(".logoff-btn");
	if (loginBtn) {
		loginBtn.addEventListener("click", async () => {
			console.log("[logoff] Login button clicked:");
			showDiv("div_logoff", false);
			showDiv("div_container", false);
			showDiv("div_main", true);
			set_div_main(div_main_state.LOGIN);
			// setDivLogin(div_main);
		}
	)};
	const continueBtn = document.querySelector(".continue-btn");
	if (continueBtn) {
		continueBtn.addEventListener("click", async () => {
			console.log("[logged] Continue button clicked:");
			showDiv("div_main", false);
			showDiv("div_container", true);
		}
	)};
}


export const  div_register: string = '<h1 id="register_title" data-i18n="register.title"></h1> \
  <label for "name" data-i18n="register.label_name"> </label> <input type="text" id="name" data-i18n="register.name" class="input"/> <br> \
  <label for "password1" data-i18n="register.label_password1"> </label> <input type="password" id="password1" class="input"/> <br> \
  <label for "password2" data-i18n="register.label_password2"> </label> <input type="password" id="password2" class="input"/> <br> \
  <label for "email" data-i18n="register.label_email"> </label> <input type="email" id="email" class="input"/> <br> \
  <button class="register-btn" id="register_button" data-i18n="register.button"></button>';

export function setDivRegister() {
  div_main.innerHTML = div_register;
//   updateI18nContent();
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
