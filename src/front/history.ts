import { updateI18nContent } from "./i18next"
import { setDivLogin, setDiv2fa, setDivRegister } from "./div_login"

showDiv("div_logoff", false);

export const div_main = document.getElementById('div_main') as HTMLDivElement;

export function showDiv(id_div: string, show: boolean) {
	const div = document.getElementById(id_div) as HTMLDivElement;
	if (div) {
		if (show)
			div.style.display = 'flex';
		else
			div.style.display = 'none';
	}
}

// (window as any).navigateTo = navigateTo;
// function navigateTo(stateKey: keyof typeof div_main_state) {
// 	set_div_main(div_main_state[stateKey]);
// }

// export enum div_main_state {
//   LOGIN = "div_login",
//   REGISTER = "div_register",
//   TWOFA = "div_2fa",
//   GAME = "div_container",
// }

// Enum теперь содержит более чистые имена, соответствующие data-view-id
export enum ViewState {
    LOGIN = "login",
    REGISTER = "register",
    TWOFA = "2fa",
    GAME = "game",
}

// Функция-предохранитель (Type Guard)
function isViewState(state: string): state is ViewState {
    return Object.values(ViewState).includes(state as ViewState);
}

let current_state: ViewState | null = null;

/**
 * Отображает нужный view-контейнер на основе data-view-id.
 * @param state Имя контейнера для отображения (должно соответствовать ViewState).
 */
export function set_view(state: ViewState) {
    if (state === current_state) return; // Состояние не изменилось
    console.log(`[view] Установка состояния: ${state}`);

    // Скрываем текущий активный view (если он есть)
    if (current_state) {
        const currentElement = document.querySelector<HTMLElement>(`.page-view[data-view-id="${current_state}"]`);
        if (currentElement) {
            currentElement.classList.add("hidden", "opacity-0");
            currentElement.classList.remove("block", "opacity-100");
        }
    }

    // Находим и отображаем целевой контейнер по data-атрибуту
    const target = document.querySelector<HTMLElement>(`.page-view[data-view-id="${state}"]`);
    
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("block");
        requestAnimationFrame(() => {
            target.classList.remove("opacity-0");
            target.classList.add("opacity-100");
        });
    } else {
        console.error(`[view] Целевой элемент с data-view-id="${state}" не найден.`);
        navigateTo(ViewState.LOGIN); // Перенаправляем на страницу по умолчанию
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

// --- Обработчики событий ---
window.addEventListener("hashchange", handleHashChange);
window.addEventListener("DOMContentLoaded", handleHashChange);

// // 1. Функция-предохранитель (Type Guard) для безопасной проверки строки
// function isDivMainState(state: string): state is div_main_state {
//     return Object.values(div_main_state).includes(state as div_main_state);
// }

// // 2. Глобальная переменная для отслеживания текущего состояния
// // (можно обойтись и без нее, но она может быть полезна для другой логики)
// let current_state: div_main_state | null = null;


// /**
//  * Отображает нужный view-контейнер на основе ID.
//  * @param state ID контейнера для отображения (должен соответствовать div_main_state).
//  */
// function set_div_main(state: div_main_state) {
//     if (state === current_state) {
//         console.log(`[view] Состояние ${state} уже активно.`);
//         return; // Ничего не делаем, если состояние не изменилось
//     }
//     console.log(`[view] Установка состояния: ${state}`);

//     // Скрываем все контейнеры (более эффективный способ)
//     document.querySelectorAll<HTMLElement>('.page-view').forEach(el => {
//         el.classList.remove("block");
//         el.classList.add("hidden");
//         el.classList.remove("opacity-100"); // Убираем видимость
//         el.classList.add("opacity-0");
//     });

//     // Находим и отображаем целевой контейнер
//     const target = document.getElementById(state);
//     if (target) {
//         target.classList.remove("hidden");
//         target.classList.add("block");
//         // CSS transition сделает анимацию плавного появления сам, без setTimeout.
//         // Браузеру нужна крошечная задержка, чтобы "увидеть" смену display.
//         requestAnimationFrame(() => {
//             target.classList.remove("opacity-0");
//             target.classList.add("opacity-100");
//         });
//     } else {
//         console.error(`[view] Целевой элемент с ID "${state}" не найден.`);
//         // Можно перенаправить на страницу по умолчанию, если целевая не найдена
//         navigateTo(div_main_state.LOGIN);
//         return;
//     }

//     current_state = state;

//     // Вызываем специфичные для состояния функции
//     switch (state) {
//         case div_main_state.LOGIN:
//             setDivLogin();
//             break;
//         case div_main_state.TWOFA:
//             setDiv2fa();
//             break;
//         case div_main_state.REGISTER:
//             setDivRegister();
//             break;
//         case div_main_state.GAME:
//             break;
//     }
//     updateI18nContent();
// }

// /**
//  * Публичная функция для навигации. Обновляет хеш в URL.
//  * @param state Целевое состояние.
//  */
// export function navigateTo(state: div_main_state) {
//     // Обновляем хеш, что вызовет событие "hashchange"
//     location.hash = state;
// }

// /**
//  * Основная логика роутера. Срабатывает при смене хеша.
//  */
// function handleHashChange() {
//     // Берем состояние ИСКЛЮЧИТЕЛЬНО из location.hash
//     const hash = location.hash.replace("#", "");
    
//     // Проверяем, является ли хеш валидным состоянием. Если нет - редирект на LOGIN.
//     if (isDivMainState(hash)) {
//         set_div_main(hash);
//     } else {
//         // Если в URL некорректный хеш, перенаправляем на страницу по умолчанию.
//         navigateTo(div_main_state.LOGIN);
//     }
// }

// // --- Обработчики событий ---

// // Слушаем изменение хеша (включая кнопки "назад"/"вперед" и вызовы navigateTo)
// window.addEventListener("hashchange", handleHashChange);

// // Инициализация при загрузке страницы
// window.addEventListener("DOMContentLoaded", () => {
//     // Сразу вызываем обработчик, чтобы отобразить начальное состояние
//     // из URL или установить состояние по умолчанию.
//     handleHashChange();
// });

// Пример того, как теперь можно вызывать навигацию (без глобальной window)
// document.getElementById('my-register-button')?.addEventListener('click', () => navigateTo(div_main_state.REGISTER));

// export function set_div_main(div_main_s: div_main_state | string, push = true) {
// 	if (!(Object.values(div_main_state) as string[]).includes(div_main_s)) return;
// 	const state = div_main_s as div_main_state;
// 	console.log("[history] set_div_main -> " + state);

// 	// Save to sessionStorage
// 	sessionStorage.setItem("div_main_state", state);

// 	// Update URL hash
// 	location.hash = state;

// 	// Push to history if needed
// 	if (push) {
// 		history.pushState({ div_main_state: state }, "", location.pathname + "#" + state);
// 		console.log("[history] push -> " + state);
// 	}

// 	// Hide all
// 	for (const id of Object.values(div_main_state)) {
// 		const el = document.getElementById(id);
// 		if (el) {
// 			el.classList.remove("block", "opacity-100");
// 			el.classList.add("hidden", "opacity-0");
// 		}
// 	}

// 	// Show target
// 	const target = document.getElementById(state);
// 	if (target) {
// 		target.classList.remove("hidden");
// 		target.classList.add("block");
// 		setTimeout(() => {
// 			target.classList.remove("opacity-0");
// 			target.classList.add("opacity-100");
// 		}, 10);
// 	}

// 	switch (state) {
// 		case div_main_state.LOGIN:
// 			setDivLogin();
// 			break;
// 		case div_main_state.TWOFA:
// 			setDiv2fa();
// 			break;
// 		case div_main_state.REGISTER:
// 			setDivRegister();
// 			break;
// 		case div_main_state.GAME:
// 			break;
// 	}

// 	updateI18nContent();
// }

// window.addEventListener("popstate", (event) => {
// 	const div_main_s = event.state?.div_main_state || sessionStorage.getItem("div_main_state");
// 	if (div_main_s) {
// 		set_div_main(div_main_s, false);
// 	}
// });

// // Restore state on load
// window.addEventListener("DOMContentLoaded", () => {
// 	const fromHash = location.hash.replace("#", "") as keyof typeof div_main_state;
// 	const state = div_main_state[fromHash] || sessionStorage.getItem("div_main_state") || div_main_state.LOGIN;
// 	set_div_main(state, false);
// });
