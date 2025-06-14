// import { setDivLogin, setDivLogged} from "./div_login"
import { ViewState, navigateTo} from "./history"
import type { User_f } from "../defines/types";

export let user_f: User_f = {id: -1};

checkLogin();
export const baseUrl = window.location.origin;

export async function checkLogin() {
	if (!await refreshToken()) {
		navigateTo(ViewState.LOGIN);
		// set_div_main(div_main_state.LOGIN, true);
		// setDivLogin(div_main);
		return;
	}
	const accessToken =  localStorage.getItem("accessToken");
	if (accessToken) {
		try {
			// const json = JSON.stringify({ accessToken: accessToken });
			const response = await fetch(`${baseUrl}/api/protected/profile`, {
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
				// set_div_main(div_main_state.LOGIN, true);
				// setDivLogin(div_main);
				return;
			}
			const data = await response.json();
			user_f.id = data.id;
			user_f.name = data.username;
			sessionStorage.setItem("id", data.id);
			sessionStorage.setItem("user", data.username);
			// user.id_ = data.id;
			// user.nick = data.username;
			navigateTo(ViewState.TWOFA);
			// set_div_main(div_main_state.TWOFA, true);
			// setDivLogged(div_main, data);
			return;
			// data.user.username + " was loggined! (id: " + data.user.id + ")";
		}  catch (err) {
			console.error("[login] Network error:", err);
		}
	}
	navigateTo(ViewState.LOGIN);
	// set_div_main(div_main_state.LOGIN, true);
	// setDivLogin(div_main);
}

async function refreshToken() {
	const refreshToken =  localStorage.getItem("refreshToken");
	if (refreshToken) {
		try {
			const response = await fetch(`${baseUrl}/api/refresh`, {
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
	}
	return true;
}
