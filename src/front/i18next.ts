import i18next from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18next
	.use(Backend)
	.use(LanguageDetector)
	.init({
		supportedLngs: ["en", "cs", "ru", "de", "es", "zh"],
		fallbackLng: "en",
		debug: true,
		backend: {
			loadPath: "/locales/{{lng}}.json"
		}
	}, () => {
		console.log("[i18n] Initialized with language:", i18next.language);
		updateContent();
	});

function updateContent() {
	console.log("[i18n] Updating content with language:", i18next.language);

	const loginTitle = document.getElementById("login_title") as HTMLElement | null;
	if (loginTitle) {
		loginTitle.innerText = i18next.t("login.title");
	}

	const loginNameInput = document.getElementById("login_name") as HTMLInputElement | null;
	if (loginNameInput) {
		loginNameInput.placeholder = i18next.t("login.placeholder");
	}

	const loginBtn = document.getElementById("login_button") as HTMLButtonElement | null;
	if (loginBtn) {
		loginBtn.innerText = i18next.t("login.button");
	}
}

// function updateContent() {
//   console.log("[i18n] Updating content with language:", i18next.language);
//   (document.getElementById("login_name") as HTMLInputElement).placeholder = i18next.t("login_name");
//   (document.getElementById("login") as HTMLButtonElement).innerText = i18next.t("login");
// }

document.querySelectorAll(".lang-btn").forEach(button => {
	button.addEventListener("click", (e) => {
		const target = e.currentTarget as HTMLElement;
		const lang = target.dataset.lang;
		console.log("[i18n] Language button clicked:", lang);
		if (lang) {
			i18next.changeLanguage(lang).then(() => {
				console.log("[i18n] Language changed to", lang);
				updateContent();
			}).catch(err => {
				console.error("[i18n] Error changing language:", err);
			});
		}
	});
});

export default i18next;