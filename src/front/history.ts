import { updateI18nContent } from "./i18next"
import {setDivLogin, setDiv2FA, setDivRegister} from "./div_login"

export enum div_main_state {
  LOGIN = "LOGIN",
  REGISTER = "REGISTER",
  TWOFA = "TWOFA",
  GAME = "GAME",
}

showDiv("div_container", false);
showDiv("div_logoff", false);

export const div_main = document.getElementById('div_main') as HTMLDivElement;
export const baseUrl = window.location.origin;

export function showDiv(id_div: string, show: boolean) {
	const div = document.getElementById(id_div) as HTMLDivElement;
	if (div) {
		if (show)
			div.style.display = 'flex';
		else
			div.style.display = 'none';
	}
}

export function set_div_main(div_main_s: div_main_state) {
	if (sessionStorage.getItem("start") != "yes")
		history.pushState({ div_main_state: sessionStorage.getItem("div_main_state") }, "", null);
	else
		sessionStorage.setItem("start", "no");
	sessionStorage.setItem("div_main_state", div_main_s);
	switch (div_main_s) {
		case div_main_state.LOGIN:
			setDivLogin();
			break;
		case div_main_state.REGISTER:
			setDivRegister();
			break;
		case div_main_state.TWOFA:
			setDiv2FA();
			break;
		case div_main_state.GAME:
			break;
	}
	updateI18nContent();
}

// Обработка кнопок "вперед"/"назад"
window.addEventListener("popstate", (event) => {
	sessionStorage.setItem("start", "no");
	const div_main_s: div_main_state  = event.state?.div_main_state || null;
	if (div_main_s)
		set_div_main(div_main_s);
});