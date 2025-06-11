import { setDivLogin, setDivLogged } from "./div_login"
// import { User, GUID } from "../defines/types"

export const div_main = document.getElementById('div_main') as HTMLDivElement;
const baseUrl = window.location.origin;

// const user: User = {id: generateGuid(), id_: -1};
// const guid: GUID = (
// 		Math.random().toString(36).substring(2, 15) +
// 		Math.random().toString(36).substring(2, 15)
// 	) as GUID;

// const user: User = {id: guid, id_: -1};

checkLogin();

export async function checkLogin() {
	if (!await refreshToken()) {
		setDivLogin(div_main);
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
				setDivLogin(div_main);
				return;
			}
			const data = await response.json();
			// user.id_ = data.id;
			// user.nick = data.username;
			setDivLogged(div_main, data);
			return;
			// data.user.username + " was loggined! (id: " + data.user.id + ")";
		}  catch (err) {
			console.error("[login] Network error:", err);
		}
	}
	setDivLogin(div_main);
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

const div_container = document.getElementById('div_container') as HTMLDivElement;
div_container.style.display = 'none'; // "flex"
