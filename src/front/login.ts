window.addEventListener("DOMContentLoaded", handleContentLoaded);
window.addEventListener("hashchange", handleHashChange);

import { initHandlers } from "./initHandlers";
import { isViewState, set_view, ViewState, navigateTo} from "./state"
import type { User_f } from "../defines/types";
import { jwtDecode } from 'jwt-decode';
import { setUser, unsetUser } from "../helpers/helpers";
import i18next from 'i18next';

export let user_f: User_f = {id: -1};
let countdownInterval: ReturnType<typeof setInterval> | undefined;

export function showErrorModal(messageKey: string) {
	const backdrop = document.querySelector<HTMLElement>(`.modal-bg[modal-bg-id="modal-bg"]`) as HTMLElement;
	const modal = document.querySelector<HTMLElement>(`.modal-err[modal-err-id="modal-err"]`) as HTMLElement;
	const modalContent = document.querySelector<HTMLElement>(`.modal-msg[modal-msg-id="modal-err"]`) as HTMLElement;
	const modalClose = document.querySelector<HTMLElement>(`.modal-btn[modal-btn-id="modal-err"]`) as HTMLElement;

	if (backdrop && modal && modalContent && modalClose) {
		modalContent.dataset.i18n = messageKey;
		modalContent.textContent = i18next.t(modalContent.getAttribute('data-i18n')!);

		backdrop.classList.remove("hidden");
		modal.classList.remove("hidden");

		const closeHandler = () => {
			backdrop.classList.add("hidden");
			modal.classList.add("hidden");
			modalClose.removeEventListener("click", closeHandler);
		};

		modalClose.addEventListener("click", closeHandler);
	}
}

function handleContentLoaded() {
	initHandlers();
	handleHashChange();
}

function handleHashChange() {
	const hash = location.hash.replace("#", "");

	checkLogin().then(() => {});
	if (isViewState(hash)) {
		set_view(hash);
	} else {
		
	}
}

export function getCookie(name: string): string | null {
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

export async function checkLogin() {
	if (validateToken("accessToken") > 0 || validateToken("refreshToken") > 0) {
		localStorage.removeItem("accessToken");
		refreshToken().then(() => {
			if (validateToken("accessToken") == 0) {
				showErrorModal("error.refersh_token_problem");
				return;
			}
		});
		getUserData().then(() => {});
		if (user_f.id !== -1) {
			const logoffBtn = document.querySelector<HTMLElement>(`.btn_click[data-btn-id="logoff"]`);
			if (logoffBtn) {
				logoffBtn.addEventListener("click", async () => {
					console.log("[LOGOFF] Logoff button clicked:");
					user_f.id = -1;
					user_f.name = "";
					unsetUser();
					localStorage.removeItem("twofaToken");
					localStorage.removeItem("accessToken");
					localStorage.removeItem("refreshToken");
					navigateTo(ViewState.LOGIN);
				}
			)};
		}
		return;
	}

	const timeLeft = validateToken("twofaToken");
	if (timeLeft > 0) {
		stopCountdown();
		startCountdown(timeLeft, logoff);
		return;
	}
}

async function refreshToken() {
	const refreshToken =  localStorage.getItem("refreshToken");
	if (refreshToken) {
		try {
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
			const data = await response.json();
			if (!response.ok) {
				console.error("[refresh] Refresh failed:", data.error);
				return false;
			}
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
		stopCountdown();
		const response = await fetch(`/api/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				username: name.value,
				password: password.value
			})
		});
		const data = await response.json();
		if (!response.ok) {
			showErrorModal("error.user_password_problem");
			console.error("[login] Login failed:", data.error);
			return;
		}
		name.value = "";
		password.value = "";

		// const qrImg = document.getElementById("qr-img") as HTMLImageElement;
		// qrImg.src = data.qr;
		// qrImg.alt = "Scan with Google Authenticator";
		// user_f.id = -2;

		// user_f.id = data.user.id;
		// user_f.name = data.user.username;
		// setUser(user_f);
		console.log("[login] Login successful, User name = ", user_f.name);
		console.log("[login] Login successful, User id =", user_f.id);
		// 💾 Сохраняем токены (в localStorage или sessionStorage)
		localStorage.setItem("twofaToken", data.twofaToken);
		navigateTo(ViewState.TWOFA);
	} catch (err) {
		console.error("[login] Network error:", err);
	}
}

export async function getUserData() {
	try {
		const response = await fetch(`/api/protected/profile`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer " + localStorage.getItem("accessToken")
			}
		});
		const data = await response.json();
		if (!response.ok) {
			console.error("[refresh] Refresh failed:", data.error);
			return;
		}
		user_f.id = data.user.id;
		user_f.name = data.user.username;
		setUser(user_f);
		console.log("[USER] Get user data:", data);
	}  catch (err) {
		console.error("[USER] Get user data:", err);
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
			const data = await response.json();
			if (!response.ok) {
				console.error("[2fa] 2FA check failed:", data.error);
				// navigateTo(ViewState.LOGIN);
				return;
			}
			stopCountdown();
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
			const data = await response.json();
			if (!response.ok) {
				console.error("[login] Login check failed:", data.error);
				navigateTo(ViewState.LOGIN);
				return;
			}
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

export function isCountdown(): boolean {
	return countdownInterval !== undefined;
}

export function stopCountdown() {
	if (countdownInterval !== undefined) {
		clearInterval(countdownInterval);
		countdownInterval = undefined;
	}
}

export function validateToken(tokenName: string): number {
	const token = localStorage.getItem(tokenName);
	if (token) {
		try {
			const decoded = jwtDecode<MyToken>(token);
			console.log("Decoded token:", decoded);

			const life_time = getTokenLife(token);
			if (life_time <= 10) {
				console.log("Token has expired");
				localStorage.removeItem(tokenName);
				return 0;
			}
			return life_time;
		} catch (err) {
			console.error("Invalid token", err);
		}
	}
	return 0;
}

export function getTokenLife(token: string): number {
	if (token) {
		try {
			const decoded = jwtDecode<MyToken>(token);
			if (decoded.exp) {
				const now = Math.floor(Date.now() / 1000); // in seconds
				return decoded.exp - now; // returns remaining time in seconds
			}
		} catch (err) {
			console.error("Invalid token", err);
		}
	}
	return 0; // if no valid token found
}
