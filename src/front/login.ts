// import { setDivLogin, setDivLogged} from "./div_login"
import { ViewState, navigateTo} from "./history"
import type { User_f } from "../defines/types";

export let user_f: User_f = {id: -1};

// export const baseUrl = window.location.origin;
checkLogin();

export async function checkLogin() {
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
			const response = await fetch(`/api/refresh`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					refreshToken: refreshToken
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				console.error("[login] Login failed:", errorData.error);
				return false;
			}
			const data = await response.json();
			console.log("[login] Refresh accessToken:", data.accessToken);
			localStorage.setItem("accessToken", data.accessToken);
		}  catch (err) {
			console.error("[login] Network error:", err);
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
		const data = await response.json();

		// const qrImg = document.getElementById("qr-img") as HTMLImageElement;
		// qrImg.src = data.qr;
		// qrImg.alt = "Scan with Google Authenticator";
		// user_f.id = -2;

		user_f.id = data.user.id;
		user_f.name = data.user.username;
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
				navigateTo(ViewState.LOGIN);
				return;
			}
			const data = await response.json();
			user_f.id = data.user.id;
			user_f.name = data.user.username;
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
			navigateTo(ViewState.GAME);
			return;
		}  catch (err) {
			console.error("[login] Network error:", err);
		}
	}
	navigateTo(ViewState.LOGIN);
}