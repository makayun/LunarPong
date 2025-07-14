window.addEventListener("DOMContentLoaded", () => {
	console.log("[WINDOW] Page loaded");
	initHandlers();
	handleHashChange();
});
// window.addEventListener("pageshow", (event) => {
// 	if (event.persisted) {
// 		console.log("[WINDOW] Page loaded from bfcache");
// 	} else {
// 		console.log("[WINDOW] Fresh page load (F5 or Ctrl+F5)");
// 		handleHashChange();
// 	}
// });
window.addEventListener("hashchange", () => {
	console.log("[WINDOW] Page hash changed");
	handleHashChange();
});

import { initHandlers } from "./initHandlers";
import { isViewState, set_view, ViewState, navigateTo} from "./state"
import type { User_f } from "../defines/types";
import { jwtDecode } from 'jwt-decode';
import { setUser, unsetUser } from "../helpers/helpers";
import i18next from 'i18next';

export let qrcode: string = "";
export let user_f: User_f = {id: -1};
let countdownInterval: ReturnType<typeof setInterval> | undefined;

export function showErrorModal(messageKey: string) {
	const backdrop = document.querySelector<HTMLElement>(`.modal-bg[modal-bg-id="modal-bg"]`) as HTMLElement;
	const modal = document.querySelector<HTMLElement>(`.modal-err[modal-err-id="modal-err"]`) as HTMLElement;
	const modalContent = document.querySelector<HTMLElement>(`.modal-msg[modal-msg-id="modal-err"]`) as HTMLElement;
	const modalClose = document.querySelector<HTMLElement>(`.modal-btn[modal-btn-id="modal-err"]`) as HTMLElement;

	if (backdrop && modal && modalContent && modalClose) {
		modalContent.dataset.i18n = "error." + messageKey;
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

async function handleHashChange() {
	const hash = location.hash.replace("#", "");

	await checkLogin();
	if (isViewState(hash)) {
		set_view(hash);
	} else {
		if (user_f.id === -1) {
			console.log(`[view] User not logged in, redirecting to LOGIN`);
			navigateTo(ViewState.LOGIN);
		} else if (isCountdown()) {
			console.log(`[view] User not logged in, but countdown is active, redirecting to 2FA`);
			navigateTo(ViewState.TWOFA);
		} else {
			console.log(`[view] User logged in, redirecting to GAME`);
			navigateTo(ViewState.GAME);
		}
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
	const newRefreshToken = getCookie("refreshToken");
	if (newRefreshToken) {
		console.log("[LOGIN] New refresh token found in cookies, updating localStorage");
		localStorage.setItem("refreshToken", newRefreshToken);
		document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
	}

	if (validateToken("accessToken") > 0 || validateToken("refreshToken") > 0) {
		localStorage.removeItem("accessToken");
		await refreshToken();
		if (validateToken("accessToken") == 0) {
			showErrorModal("refresh_token_problem");
			return;
		}
		await getUserData("accessToken");
		return;
	}

	const timeLeft = validateToken("twofaToken");
	if (timeLeft > 0) {
		stopCountdown();
		await getUserData("twofaToken");
		if (user_f.id !== -1) {
			startCountdown(timeLeft, logoff);
		} else {
			showErrorModal("2fa_token");
		}
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
	if(name.value === password.value){
		console.error("[login] User is built different");
		showErrorModal("pass_same_username");
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
			if (data.cli_error === "user_exist") {
				showErrorModal("user_exist");
				console.error("[login] User already logged in:", data.error);
				return;
			}
			showErrorModal("user_password_problem");
			console.error("[login] Login failed:", data.error);
			return;
		}
		name.value = "";
		password.value = "";

		user_f.id = data.user.id;
		console.log("[login] Login successful, User id =", user_f.id);
		// 💾 Сохраняем токены (в localStorage или sessionStorage)
		localStorage.setItem("twofaToken", data.twofaToken);
		navigateTo(ViewState.TWOFA);
	} catch (err) {
		console.error("[login] Network error:", err);
	}
}

export async function getUserData(tokenName: string) {
	const token =  localStorage.getItem(tokenName);
	console.debug("[USER] ",  tokenName, ":", token);
	if (token) {
		try {
			const response = await fetch(`/api/protected/profile`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"Authorization": "Bearer " + token
				}
			});
			const data = await response.json();
			if (!response.ok) {
				console.error("[USER] Refresh failed:", data.error);
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
}

export async function twofa() {
	const token = document.querySelector<HTMLElement>(`.data_input[data-input-id="2fa_token"]`) as HTMLInputElement;
	if (!token.value) {
		console.log("[2FA] Code is empty");
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
				console.error("[2FA] Check failed:", data.error);
				showErrorModal("2fa_invalid_code");
				// navigateTo(ViewState.LOGIN);
				return;
			}
			stopCountdown();
			token.value = "";
			user_f.id = data.user.id;
			user_f.name = data.user.username;
			setUser(user_f);
			localStorage.removeItem("twofaToken");
			localStorage.setItem("accessToken", data.accessToken);
			localStorage.setItem("refreshToken", data.refreshToken);
			navigateTo(ViewState.GAME);
			return;
		}  catch (err) {
			console.error("[2FA] Network error:", err);
		}
	}
	console.log("[2FA] Code is expired or bad");
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

function isStrongPassword(password: string): boolean {
	return (
		password.length >= 8 &&
		/[A-Z]/.test(password) &&
		/[a-z]/.test(password) &&
		/[0-9]/.test(password) &&
		/[^A-Za-z0-9]/.test(password) // special character
	);
}

function isUsernameOK(username: string): boolean {
	return (
		username.length > 3 // &&
		// /[A-Z]/.test(username) &&
		// /[a-z]/.test(username) &&
		// /[0-9]/.test(username) &&
		// /[^A-Za-z0-9]/.test(username) // special character
	);
}

export async function register() {
	const username = document.querySelector<HTMLElement>(`.data_input[data-input-id="register_username"]`) as HTMLInputElement;

	if (!isUsernameOK(username.value)) {
		console.error("[REGISTER] Username is short.");
		showErrorModal("register_username_short");
		return;
	}

	const password1 = document.querySelector<HTMLElement>(`.data_input[data-input-id="register_password1"]`) as HTMLInputElement;
	const password2 = document.querySelector<HTMLElement>(`.data_input[data-input-id="register_password2"]`) as HTMLInputElement;
	if(password1.value === username.value){
		console.error("[REGISTER] User is built different");
		showErrorModal("pass_same_username");
		return;
	}
	if (password1.value !== password2.value) {
		console.error("[REGISTER] Passwords do not match.");
		showErrorModal("register_password");
		return;
	}

	if (!isStrongPassword(password1.value)) {
		console.error("[REGISTER] Password is weak.");
		showErrorModal("register_password_weak");
		return;
	}

	const check_agreement = document.querySelector<HTMLElement>(`.data_input[data-input-id="check_agreement"]`) as HTMLInputElement;
	if (!check_agreement.checked) {
		showErrorModal("check_agreemnt");
		return;
	}

	try {
		const response = await fetch(`/api/register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				username: username.value,
				password: password1.value
			})
		});
		const data = await response.json();
		if (!response.ok) {
			console.error("[REGISTER] Register failed:", data.error);
			console.error("[REGISTER] cli_error:", data.cli_error);
			showErrorModal(data.cli_error);
			return;
		}
		console.log("[REGISTER] User registered.");
		qrcode = data.qr;
		username.value= "";
		password1.value = "";
		password2.value = "";
		navigateTo(ViewState.QRCODE);
	}  catch (err) {
		console.error("[REGISTER] Network error:", err);
	}
}

export function clearQRcode() {
	qrcode = "";
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
