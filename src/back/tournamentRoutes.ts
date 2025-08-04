import { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { InitGameRequest, GameType, User } from '../defines/types';

export async function tournamentRoutes(fastify: FastifyInstance) {
    console.log('Registering tournamentRoutes...');
    fastify.post('/', async (request, reply) => {
        try {
            console.log("Status before POST tournament.ts:410");

            const body = request.body as Partial<{ gameType: GameType; user: User }>;

            const gameType = body.gameType ?? 'Local game';
            const user = body.user ?? { id: -1, nick: "Browser Player" };

            const msg: InitGameRequest = {
                type: "InitGameRequest",
                gameType,
                user,
            };

            await new Promise<void>((resolve, reject) => {
                const ws = new WebSocket('wss://localhost:12800/ws-game', {
                    rejectUnauthorized: false
                });

                ws.on('open', () => {
                    console.log('WebSocket opened, sending:', msg);
                    ws.send(JSON.stringify(msg));
                    resolve();
                });

                ws.on('error', (err) => {
                    console.error('WebSocket error:', err);
                    reject(err);
                });
            });

            console.log("Status after POST tournament.ts:422");
            reply.send({ status: 'ok', sent: msg });

        } catch (err) {
            console.error('Tournament route error:', err);
            reply.status(500).send({ error: 'Internal error' });
        }
    });
}
