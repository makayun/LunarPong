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


// const path = require('node:path')
// import path from 'node:path';
// import I18n from 'node:i18n';
// const i18n = new I18n({
//   locales: ['en', 'de'],
//   directory: path.join(__dirname, '../locales')
// })


import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

// Инициализация
i18next
  .use(Backend)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    backend: {
      loadPath: path.join(__dirname, './locales/{{lng}}.json'),
    },
  })
  .then(() => {
    console.log(i18next.t('hello', { name: 'Alex' }));
    i18next.changeLanguage('ru').then(() => {
      console.log(i18next.t('hello', { name: 'Alex' }));
    });
  });
