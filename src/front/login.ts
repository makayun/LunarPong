
window.addEventListener("DOMContentLoaded", handleHashChange);
window.addEventListener("hashchange", handleHashChange);

// import { setDivLogin, setDivLogged} from "./div_login"
import { isViewState, set_view, ViewState, navigateTo} from "./state"
import type { User_f } from "../defines/types";
import { jwtDecode } from 'jwt-decode';
import { setUser, unsetUser } from "../helpers/helpers";

export let user_f: User_f = {id: -1};

// function contentLoaded() {
// 	const hash = location.hash.replace("#", "");

// 	if (isViewState(hash)) {
// 		if (hash === ViewState.GAME && user_f.id === -1) {
// 			// Если мы попали на страницу игры, проверяем авторизацию

// 			checkLogin();
// 			return;
// 		}
// 		set_view(hash);
// 	} else {
// 		// Если в URL нет хеша или он некорректный, устанавливаем состояние по умолчанию
// 		navigateTo(ViewState.LOGIN);
// 	}
// }

/**
* Основная логика роутера. Срабатывает при смене хеша.
*/
function handleHashChange() {
	const hash = location.hash.replace("#", "");

	if (isViewState(hash)) {
		set_view(hash);
	} else {
		// Если в URL нет хеша или он некорректный, устанавливаем состояние по умолчанию
		navigateTo(ViewState.LOGIN);
	}
}

function getCookie(name: string): string | null {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) {
		return parts.pop()!.split(';').shift() || null;
	}
	return null;
}

interface MyToken {
	sub: string;
	exp: number;
	iat: number;
	// add other fields here
}

// export const baseUrl = window.location.origin;
checkLogin();

export async function checkLogin() {
	if (validateToken("twofaToken"))  {
		navigateTo(ViewState.TWOFA);
		return;
	}

	const c_refreshToken = getCookie('refreshToken');
	if (c_refreshToken) {
		// console.log('Access token from cookie:', c_refreshToken);
		localStorage.setItem("refreshToken", c_refreshToken);
		document.cookie = `refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
	}

	if (!await refreshToken()) {
		navigateTo(ViewState.LOGIN);
		return;
	}

	const accessToken =  localStorage.getItem("accessToken");
	if (accessToken) {
		try {
			const response = await fetch(`/api/protected/profile`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"Authorization": "Bearer " + accessToken
				}
			});
			if (!response.ok) {
				const errorData = await response.json();
				console.error("[login] Login check failed:", errorData.error);
				navigateTo(ViewState.LOGIN);
				return;
			}
			const data = await response.json();
			user_f.id = data.user.id;
			user_f.name = data.user.username;
			setUser(user_f);
			const logoffBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="logoff"]`);
			if (logoffBtn) {
				logoffBtn.addEventListener("click", async () => {
					console.log("[logoff] Login button clicked:");
					user_f.id = -1;
					user_f.name = "";
					unsetUser();
					localStorage.removeItem("twofaToken");
					localStorage.removeItem("accessToken");
					localStorage.removeItem("refreshToken");
					navigateTo(ViewState.LOGIN);
				}
			)};
			navigateTo(ViewState.GAME);
			return;
		}  catch (err) {
			console.error("[login] Network error:", err);
		}
	}
	navigateTo(ViewState.LOGIN);
}

async function refreshToken() {
	const refreshToken =  localStorage.getItem("refreshToken");
	if (refreshToken) {
		try {
			//const response = await fetch(`${baseUrl}/api/refresh`, {
			const response = await fetch(`/api/protected/refresh`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": "Bearer " + refreshToken
				},
				body: JSON.stringify({
					token: refreshToken
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				console.error("[refresh] Refresh failed:", errorData.error);
				return false;
			}
			const data = await response.json();
			user_f.id = data.user.id;
			user_f.name = data.user.username;
			setUser(user_f);
			console.log("[refresh] Refresh accessToken:", data.accessToken);
			localStorage.setItem("accessToken", data.accessToken);
		}  catch (err) {
			console.error("[refresh] Network error:", err);
			return false;
		}
	} else {
		return false;
	}
	return true;
}

export async function login() {
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
		stopCountdown();
		const data = await response.json();

		// const qrImg = document.getElementById("qr-img") as HTMLImageElement;
		// qrImg.src = data.qr;
		// qrImg.alt = "Scan with Google Authenticator";
		// user_f.id = -2;

		user_f.id = data.user.id;
		user_f.name = data.user.username;
		setUser(user_f);
		console.log("[login] Login successful, User name = ", user_f.name);
		console.log("[login] Login successful, User id =", user_f.id);
		// 💾 Сохраняем токены (в localStorage или sessionStorage)
		localStorage.setItem("twofaToken", data.twofaToken);
		navigateTo(ViewState.TWOFA);
	} catch (err) {
		console.error("[login] Network error:", err);
	}
}

export async function twofa() {
	const token = document.querySelector<HTMLElement>(`.data_input[data-input-id="2fa_token"]`) as HTMLInputElement;
	if (!token.value) {
		console.log("[2fa] Code is empty");
		return;
	}
	const twofaToken =  localStorage.getItem("twofaToken");
	if (twofaToken ) {
		try {
			const response = await fetch(`/api/protected/2fa`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": "Bearer " + twofaToken
				},
				body: JSON.stringify({
					id: user_f.id,
					token: token.value
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				console.error("[2fa] 2FA check failed:", errorData.error);
				// navigateTo(ViewState.LOGIN);
				return;
			}
			stopCountdown();
			const data = await response.json();
			user_f.id = data.user.id;
			user_f.name = data.user.username;
			setUser(user_f);
			localStorage.removeItem("twofaToken");
			localStorage.setItem("accessToken", data.accessToken);
			localStorage.setItem("refreshToken", data.refreshToken);
			navigateTo(ViewState.GAME);
			return;
		}  catch (err) {
			console.error("[2fa] Network error:", err);
		}
	}
	console.log("[2fa] Code is expired or bad");
	navigateTo(ViewState.LOGIN);
}

export async function logoff() {
	console.log("[logoff] Login button clicked:");
	stopCountdown();
	localStorage.removeItem("twofaToken");
	localStorage.removeItem("accessToken");
	localStorage.removeItem("refreshToken");
	user_f.id = -1;
	user_f.name = "";
	unsetUser();
	navigateTo(ViewState.LOGIN);
}

export async function register() {
	if (!await refreshToken()) {
		navigateTo(ViewState.LOGIN);
		return;
	}
	const accessToken =  localStorage.getItem("accessToken");
	if (accessToken) {
		try {
			const response = await fetch(`/api/protected/profile`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"Authorization": "Bearer " + accessToken
				}
			});
			if (!response.ok) {
				const errorData = await response.json();
				console.error("[login] Login check failed:", errorData.error);
				navigateTo(ViewState.LOGIN);
				return;
			}
			const data = await response.json();
			user_f.id = data.user.id;
			user_f.name = data.user.username;
			setUser(user_f);
			navigateTo(ViewState.GAME);
			return;
		}  catch (err) {
			console.error("[login] Network error:", err);
		}
	}
	navigateTo(ViewState.LOGIN);
}

let countdownInterval: ReturnType<typeof setInterval> | undefined;

export function startCountdown(seconds: number, onComplete: () => void) {
	const countdownEl = document.querySelector<HTMLElement>(`.countdown[countdown-id="2fd"]`);
	if (!countdownEl) return;

	let remaining = seconds;

	countdownEl.textContent = `${remaining} seconds remaining`;

	countdownInterval = setInterval(() => {
		remaining--;

		if (remaining > 0) {
			countdownEl.textContent = `${remaining} seconds remaining`;
		} else {
			stopCountdown(); // <- очищаем перед вызовом
			onComplete();
		}
	}, 1000);
}

export function stopCountdown() {
	if (countdownInterval !== undefined) {
		clearInterval(countdownInterval);
		countdownInterval = undefined;
	}
}

export function validateToken(tokenName: string): boolean {
	const token = localStorage.getItem(tokenName);
	if (token) {
		try {
			const decoded = jwtDecode<MyToken>(token);
			console.log("Decoded token:", decoded);

			// Optional: check expiration manually
			const now = Math.floor(Date.now() / 1000) + 10; // in seconds
			if (decoded.exp && decoded.exp < now) {
				console.log("Token has expired");
				localStorage.removeItem(tokenName);
			} else {
				console.log("Token is still valid (not expired)");
				const timeLeft = decoded.exp - now;
				stopCountdown();
				startCountdown(timeLeft, logoff);
				return true;
			}
		} catch (err) {
			console.error("Invalid token", err);
		}
	}
	return false;
}
