import { updateI18nContent } from "./i18next"
import { setDivLogin, setDiv2fa, setDivRegister } from "./div_login"
import { user_f } from "./login"

// Enum теперь содержит более чистые имена, соответствующие data-view-id
export enum ViewState {
	LOGIN = "login",
	REGISTER = "register",
	TWOFA = "2fa",
	GAME = "game",
}

// Функция-предохранитель (Type Guard)
export function isViewState(state: string): state is ViewState {
	return Object.values(ViewState).includes(state as ViewState);
}

let current_state: ViewState | null = null;

/**
 * Отображает нужный view-контейнер на основе data-view-id.
 * @param state Имя контейнера для отображения (должно соответствовать ViewState).
 */
export function set_view(state: ViewState) {
	if (state === current_state) return; // Состояние не изменилось
	// if (state != ViewState.LOGIN && state != ViewState.REGISTER && user_f.id == -1 && !isCountdown()) {
	// 	console.log(`[VIEW] return`);
	// }
	const logoffElement = document.querySelector<HTMLElement>(`.div-logoff`);
	if (logoffElement) {
		if (user_f.id !== -1) {
			console.log(`[VIEW] Put the button logoff on`);
			logoffElement.classList.remove("hidden");
			logoffElement.classList.add("flex");
			requestAnimationFrame(() => {
				logoffElement.classList.remove("opacity-0");
				logoffElement.classList.add("opacity-100");
			});
		} else {
			console.log(`[VIEW] Put the button logoff off`);
			logoffElement.classList.add("hidden", "opacity-0");
			logoffElement.classList.remove("flex", "opacity-100");
		}
	}

	console.log(`[view] Установка состояния: ${state}`);

	// Скрываем текущий активный view (если он есть)
	if (current_state) {
		const currentElement = document.querySelector<HTMLElement>(`.page-view[data-view-id="${current_state}"]`);
		if (currentElement) {
			currentElement.classList.add("hidden", "opacity-0");
			currentElement.classList.remove("flex", "opacity-100");
		}
	}

	// Находим и отображаем целевой контейнер по data-атрибуту
	const target = document.querySelector<HTMLElement>(`.page-view[data-view-id="${state}"]`);
	
	if (target) {
		target.classList.remove("hidden");
		target.classList.add("flex");
		requestAnimationFrame(() => {
			target.classList.remove("opacity-0");
			target.classList.add("opacity-100");
		});
	} else {
		console.error(`[view] Целевой элемент с data-view-id="${state}" не найден.`);
		// navigateTo(ViewState.LOGIN); // Перенаправляем на страницу по умолчанию
		return;
	}

	current_state = state;

	// Вызов специфичных для состояния функций...
	switch (state) {
		case ViewState.LOGIN:
			setDivLogin();
			break;
		case ViewState.TWOFA:
			setDiv2fa();
			break;
		case ViewState.REGISTER:
			setDivRegister();
			break;
		case ViewState.GAME:
			break;
	}
	updateI18nContent();
}

/**
 * Публичная функция для навигации. Обновляет хеш в URL.
 * @param state Целевое состояние.
 */
export function navigateTo(state: ViewState) {
	location.hash = state;
}
