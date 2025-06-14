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
			// const json = JSON.stringify({ accessToken: accessToken });
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
			sessionStorage.setItem("id", data.user.id);
			sessionStorage.setItem("user", data.user.username);
			navigateTo(ViewState.TWOFA);
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
