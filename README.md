## Lunar Pong (aka ft_transcendence)

LunarPong is a modern 3D take on the classic Pong game, featuring multiplayer, AI opponents, live chat, secure authentication, and more.

A final project of the main course in the 42 Prague coding school.
The project is made of several modules dictated by the current subject of this project, each module corresponds to an exact technology or a useful feature.

Modules used in the final version:
- Backend framework: [Fastify](https://fastify.dev/) running on [Node.js](https://nodejs.org/)
- Frontend framework: [Tailwind CSS](https://tailwindcss.com/)
- Database: [SQLite](https://sqlite.org/)
- 3D: [Babylon.js](https://www.babylonjs.com/)
- Security: [ModSecurity](https://modsecurity.org/) + [HashiCorp Vault](https://www.hashicorp.com/en/products/vault)
- Remote authentication using [OAuth 2.0](https://oauth.net/2/) (Google and 42 Network were used)
- Remote players
- Live Chat
- AI opponent
- GDPR complinance
- 2FA + JWT
- Multiple Browser Compatibility (Firefox was mandatory, others - as a module)
- Multiple language support
- Server-Side Pong

## Contributors:

[bratzwitch](https://github.com/bratzwitch):
- Tailwind, Webpack, i18next, tournament
  
[NataliaCsonka](https://github.com/NataliaCsonka):
- SQLite, visual design, testing

[OnnaMcadva](https://github.com/OnnaMcadva):
- Fastify, chat, game logic, AI opponnent, tournament

[skamn-costya](https://github.com/skamn-costya):
- SQLite, i18next, authentication, all the security, containerization, page navigation

[makayun](https://github.com/makayun):
- Webpack, Babylon.js, Fastify, game logic

## How to start:

- Add an .env file to the root of the project. It needs JWT_SECRET and DATABASE_PATH variables. For Google and 42 Network authentication you'll need to register your own OAuth profiles and add corresponding variables to the .env
- ```npm i```
- ```npm run build```
- ```npm start```

