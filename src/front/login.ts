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
