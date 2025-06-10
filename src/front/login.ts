document.querySelectorAll(".login-btn").forEach(button => {
	button.addEventListener("click", async () => {
		console.log("[login] Login button clicked:");

		const login_name = document.getElementById('login_name') as HTMLInputElement;
		const login_password = document.getElementById('login_password') as HTMLInputElement;

		if (!login_name.value || !login_password.value) {
			console.log("[login] login name or password empty");
			return;
		}

		try {
			const baseUrl = window.location.origin; 
			const response = await fetch(`${baseUrl}/api/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					username: login_name.value,
					password: login_password.value
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error("[login] Login failed:", errorData.error);
				return;
			}

			const data = await response.json();
			console.log("[login] Login successful, accessToken:", data.accessToken);
			console.log("[login] Login successful, refreshToken:", data.refreshToken);

			// 💾 Сохраняем токены (в localStorage или sessionStorage)
			localStorage.setItem("accessToken", data.accessToken);
			localStorage.setItem("refreshToken", data.refreshToken);
		} catch (err) {
			console.error("[login] Network error:", err);
		}
	});
});

// const sqlite = require('node:sqlite');

// import i18n from "node:i18n"
// import path from 'node:path';
// i18n.configure({
//   locales: ['en', ''],
//   defaultLocale: 'en',
//   queryParameter: 'lang',
//   directory: path.join('./', 'locales'),
//   api: {
//     '__': 'translate',
//     '__n': 'translateN'
//   },
// });
// export default i18n;

// import i18next from 'i18next';
// import Backend from 'i18next-http-backend';
// import LanguageDetector from 'i18next-browser-languagedetector';

const div_container = document.getElementById('div_container') as HTMLDivElement;
div_container.style.display = 'none'; // "flex"
// const div_game = document.getElementById('div_game') as HTMLDivElement;
// div_game.style.display = 'none';
// const div_chat = document.getElementById('div_chat') as HTMLDivElement;
// div_chat.style.display = 'none'; // 'block';

// i18next
//   .use(Backend)
//   .use(LanguageDetector)
//   .init({
//     fallbackLng: 'en',
//     backend: {
//       loadPath: '/locales/{{lng}}.json', // например, /public/locales/en.json
//     },
//   })
//   .then(() => {
//     console.log(i18next.t('hello', { name: 'Alex' }));
//   });

// (window as any).changeLang = (lng: string) => {
//   i18next.changeLanguage(lng).then(() => {
//     console.log(i18next.t('hello', { name: 'Alex' }));
//   });
// };
