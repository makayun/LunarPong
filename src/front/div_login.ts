// import { ViewState, navigateTo } from "./state"
import { user_f, isCountdown, qrcode } from "./login"

function disableDiv(divName: string) {
	const container = document.querySelector<HTMLElement>(`.` + divName);
	if (!container) {
		console.error(`Container with class .` + divName + ` not found.`);
		return;
	}
	const elements = container.querySelectorAll("input, button, select, textarea");

	elements?.forEach(el => {
		if ('disabled' in el) {
			(el as HTMLInputElement).disabled = true;
		}
	});

	const links = container.querySelectorAll("a");
	links.forEach(link => {
		link.addEventListener("click", function (event) {
			event.preventDefault(); // отменяет переход
			console.log("Ссылка отключена:", link.href);
		});
	});
}

function enableDiv(divName: string) {
	const container = document.querySelector<HTMLElement>(`.` + divName);
	if (!container) {
		console.error(`Container with class .` + divName + ` not found.`);
		return;
	}
	const elements = container.querySelectorAll("input, button, select, textarea");
	
	elements?.forEach(el => {
		if ('disabled' in el) {
			(el as HTMLInputElement).disabled = false;
		}
	});

	const links = container.querySelectorAll("a");
	links.forEach(link => {
		// Удаляем обработчик события (если он был добавлен)
		link.replaceWith(link.cloneNode(true));
	});
}

export function setDivLogin() {
	if (user_f.id === -1) {
		enableDiv("div-login");
	} else {
		disableDiv("div-login");
	}
}

export function setDiv2fa() {
	if (isCountdown()) {
		enableDiv("div-2fa");
	} else {
		disableDiv("div-2fa");
	}
	// const el = document.querySelector('[data-i18n="logged.title"]');
	// if (el) {
	// 	el.setAttribute('data-i18n-args', JSON.stringify({ name: user_f.name, id: user_f.id }));
	// }
}

export function setDivRegister() {
	if (user_f.id === -1) {
		enableDiv("div-register");
	} else {
		disableDiv("div-register");
	}
}

export function setDivQRcode() {
	if (qrcode !== "") {
		const img = document.querySelector<HTMLElement>(`.qrcode_img`) as HTMLImageElement;
		if (img) {
			img.src = qrcode;
		}
	}
	// if (user_f.id === -1) {
	// 	enableDiv("div-qr-code");
	// } else {
	// 	disableDiv("div-qr-code");
	// }
}
