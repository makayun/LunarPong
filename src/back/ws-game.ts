import type { FastifyInstance }	from "fastify";
import type { FastifyRequest }	from "fastify";
import type { WebSocket }		from "@fastify/websocket";
// import ActiveService			from "./active_service";
// import UserSession				from "./user_session";
import { TournamentService }	from './sqlib'
import { Tournament } from "./tournament_back"; // ✨✨✨✨✨✨✨

// import { startGameLog } from "./db";
import { PongBackEngine }	from "../scenes/PongBackScene";
import { PongBackScene }	from "../scenes/PongBackScene";
import { PADDLE_STEP }				from "../defines/constants";
import { animatePaddleToX } from "./paddleMovement";
import type { InitGameRequest, WSMessage, User, InitGameSuccess, PlayerSide, GameType } from "../defines/types";
import { AIOpponent } from "./aiOpponent";
import { error } from "node:console";

const TrnmntSrv = new TournamentService();

// export interface WsGamePluginOptions { engine: PongBackEngine; users: User[]; activeService: ActiveService; };
export interface WsGamePluginOptions { engine: PongBackEngine; users: User[]; };

export async function wsGamePlugin(server: FastifyInstance, options: WsGamePluginOptions) {
	const { engine } = options;
	const tournaments: Map<string, Tournament> = new Map(); // ✨✨✨✨✨✨✨

	server.get("/ws-game", { websocket: true }, (socket: WebSocket, _req: FastifyRequest) => {
		server.log.info("[GAME] WebSocket connected");

		socket.on("message", (message: string) => {
			try {
				const msg: WSMessage = JSON.parse(message);

				switch (msg.type) {
				    // ✨✨✨✨✨✨✨✨✨✨✨✨
                    case "Tournament":
                        const { user, tournamentId } = msg;
                        let tournament = tournaments.get(tournamentId);
                        if (!tournament) {
                            tournament = new Tournament(tournamentId);
                            tournaments.set(tournamentId, tournament);
                        }
                        tournament.addPlayer({ ...user, gameSocket: socket });
                        TrnmntSrv.addUser(Number(tournamentId), user.id);
						const waitingScene = engine.scenes.find(scene => 
                            scene.players.length === 1 && 
                            scene.state === "init" && 
                            scene.players[0].id === user.id
                        );
                        if (waitingScene) {
                            engine.scenes = engine.scenes.filter(scene => scene.id !== waitingScene.id);
                            console.log(`Player ${user.id} removed from waiting scenes`);
                        }
    					break;
                    // ✨✨✨✨✨✨✨✨✨✨✨✨
				// case "register":
				// 	console.debug("Registering user in game:", msg.user.id);
				// 	const userSessionIDX: number = options.activeService.getSessionIDX(msg.user.id)
				// 	console.debug(`User session index for ${msg.user.id} (socket_g):`, userSessionIDX);
				// 	if (userSessionIDX === -1) {
				// 		options.activeService.add(msg.user.id, socket);
				// 		console.log(`User ${msg.user.id} registered in ActiveService.`);
				// 	} else {
				// 		options.activeService.getSession(userSessionIDX)?.setSocketG(socket);
				// 		console.log(`User ${msg.user.id} is already active in ActiveService, just add the game socket.`);
				// 	}
				// 	break;
				case "InitGameRequest":
					processInitGameRequest(engine, socket, msg as InitGameRequest);
					break;
				case "PlayerInput":
					let scene = engine.scenes.find(scene => scene.id === msg.gameId);
				if (scene) {
						const paddle = msg.side === "left" ? scene.pongMeshes.paddleLeft : scene.pongMeshes.paddleRight;
						scene.stopAnimation(paddle);
						animatePaddleToX(paddle, paddle.position.z + PADDLE_STEP * msg.direction);
					}
					break;
				default:
					console.error(`Bad WS message: ${msg}`);
					// socket.send(`Bad WS message: ${msg}`);
				}
			}
			catch (e) {
				// socket.terminate();
				console.error(e, message);
			}
		});

		socket.on("close", () => {
			server.log.info("[GAME] WebSocket disconnected");
			engine.removePlayerBySocket(socket);
		});

		socket.on("pong", () => {
			console.debug("Received pong from client (socket_g)");
			socket.isAlive = true;
		});
	});
}

async function processInitGameRequest(engine: PongBackEngine, socket: WebSocket, msg: InitGameRequest): Promise<void> {
	// *Наташа: Старт логирования игры
    // const logId = await startGameLog(msg.user.id, msg.opponent.id);
    // (можно передать logId в сцену)

	console.log("Initializing game for player:", [msg.user.id], ", type : ", msg.gameType);

	engine.scenes.forEach(
		scene => scene.players.forEach(
			player => {
				if (player.id === msg.user.id || player.gameSocket === msg.user.gameSocket) {
					console.error("User", [msg.user.id], "is already playing!");
					return;
				}
			}
		)
	)

	switch (msg.gameType) {
		case "Local game":
			return await createLocalGame(engine, msg.user, socket);
		case "Remote game":
			return await createRemoteGame(engine, msg.user, socket);
		case "Versus AI":
			return await createAiGame(engine, msg.user, socket);
	}
}

async function createLocalGame(engine: PongBackEngine, player: User, socket: WebSocket) : Promise<void> {
	const game = new PongBackScene(engine);
	addPlayerToGame(game, player, socket);
	await game.enablePongPhysics();
	sendInitGameSuccess("Local game", game.id, assignSide(game), socket);
}

async function createRemoteGame(engine: PongBackEngine, newPlayer: User, socket: WebSocket) : Promise<void> {
	let game = engine.scenes.find(scene => scene.players.length === 1 && scene.state === "init");
	if (game) {
		addPlayerToGame(game, newPlayer, socket);
		await game.enablePongPhysics();
	}
	else {
		game = new PongBackScene(engine);
		addPlayerToGame(game, newPlayer, socket);
	}
	sendInitGameSuccess("Remote game", game.id, assignSide(game), socket);
}

async function createAiGame(engine: PongBackEngine, newPlayer: User, socket: WebSocket) : Promise<void> {
	const game = new PongBackScene(engine);
	addPlayerToGame(game, newPlayer, socket);
	addAiOpponent(game);
	await game.enablePongPhysics();
	sendInitGameSuccess("Versus AI", game.id, "left", socket);
}

function addPlayerToGame(game: PongBackScene, newPlayer: User, socket: WebSocket) : void {
	if (!game.players.find(player => player.id === newPlayer.id)) {
		newPlayer.gameSocket = socket;
		game.players.push(newPlayer);
		if (game.id === -1) {
			game.id = TrnmntSrv.createRemoteGame(newPlayer.id);
			console.debug("Create game:", game.id, ", player:", newPlayer.id);
		} else {
			game.id = TrnmntSrv.addRemoteGame(game.id, newPlayer.id);
			console.debug("Update game:", game.id, ", player", newPlayer.id);
		}
		if (game.id === -1) {
			console.error("Failed to create game or add player in database for game:", game.id, ", player", newPlayer.id);
			return;
		}
	}
}

function assignSide(game: PongBackScene) : PlayerSide {
	if (game.players.length === 1)
		return "left";
	else if (game.players.length === 2)
		return "right";
	else
		throw error("Invalid number of players!");
}

function addAiOpponent(game: PongBackScene) : void {
	if (!game.aiOpponent)
		game.aiOpponent = new AIOpponent(game/*, "right"*/);
}

function sendInitGameSuccess(inGameType: GameType, inGameId: number, inPlayerSide: PlayerSide, socket: WebSocket) {
	const response : InitGameSuccess = {
		type: "InitGameSuccess",
		gameType: inGameType,
		gameId: inGameId,
		gameState: "init",
		playerSide: inPlayerSide
	}

	socket.send(JSON.stringify(response));
}