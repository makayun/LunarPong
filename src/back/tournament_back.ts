import type { User } from "../defines/types";
import { TournamentService } from "./sqlib";

interface Match {
    player1: User;
    player2: User;
    result: User | null;
    gameId?: number;
}

export class TournamentB {
    name: string;
    players: User[] = [];
    matches: Match[] = [];
    started: boolean = false;
    private service = new TournamentService();
    private tournamentId: number = -1;

    constructor(name: string) {
        this.name = name;
    }

    runTournament(player1: User, player2: User, player3: User, player4: User): User | null {
        this.addPlayer(player1);
        this.addPlayer(player2);
        this.addPlayer(player3);
        this.addPlayer(player4);
        this.startTournament();

        if (this.matches[2].result === null) {
            throw new Error("Final match not completed.");
        }

        return this.matches[2].result;
    }

    addPlayer(player: User): void {
        if (!this.started && this.players.length < 4 && !this.players.some(p => p.id === player.id)) {
            this.players.push(player);
        }
    }

    private startTournament(): void {
        if (this.players.length === 4) {
            this.started = true;
            this.tournamentId = this.service.createTournament(this.name, 4);

            for (const player of this.players) {
                this.service.addUser(this.tournamentId, player.id);
            }

            this.matches = this.generateMatches();
            this.service.startTournament(this.tournamentId);
        }
    }

    private generateMatches(): Match[] {
        const g0 = this.service.createGame(this.tournamentId, this.players[0].id, this.players[1].id);
        const g1 = this.service.createGame(this.tournamentId, this.players[2].id, this.players[3].id);
        const g2 = this.service.createGame(this.tournamentId, 0, 0); // final

        return [
            { player1: this.players[0], player2: this.players[1], result: null, gameId: g0 },
            { player1: this.players[2], player2: this.players[3], result: null, gameId: g1 },
            { player1: {} as User, player2: {} as User, result: null, gameId: g2 }
        ];
    }

    private reportResult(matchIndex: number, winner: User | null): void {
        if (this.started && matchIndex >= 0 && matchIndex < this.matches.length) {
            this.matches[matchIndex].result = winner;
        }
    }

    getResults(): Match[] {
        return this.matches;
    }

    handleGameOver(gameId: number, winnerNick: string | null): void {
        const matchIndex = this.matches.findIndex(match => match.gameId === gameId);
        if (matchIndex === -1) {
            console.log(`No match found for gameId ${gameId}`);
            return;
        }

        const match = this.matches[matchIndex];
        const winner = winnerNick
            ? (match.player1.nick === winnerNick ? match.player1 : match.player2.nick === winnerNick ? match.player2 : null)
            : null;

        this.reportResult(matchIndex, winner);

        /* obnovit schet v DB */
        this.service.updateGame(
            gameId,
            winner?.id === match.player1.id ? 1 : 0,
            winner?.id === match.player2.id ? 1 : 0
        );

        /* esli 1/2 finala to zapisyvaem pobeditelya */
        if ((matchIndex === 0 || matchIndex === 1) && winner) {
            const final = this.matches[2];
            if (!final.player1.id) final.player1 = winner;
            else final.player2 = winner;

            /* obnovlenie dannyx finala v DB */
            if (final.player1.id && final.player2.id) {
                this.service.updateGame(final.gameId!, final.player1.id, final.player2.id);
            }
        }

        /* esli final sygran to otpravlyaem resultat i zavershaem turnir */
        if (matchIndex === 2 && winner) {
            this.service.endTournament(this.tournamentId);

            this.players.forEach(player => {
                const profile = this.service.getProfile(player.id);

                player.gameSocket?.send(JSON.stringify({
                    type: "TournamentResult",
                    tournamentId: this.name,
                    winner: winner.nick,
                    results: this.getResults().map(match => ({
                        player1: match.player1.nick,
                        player2: match.player2.nick,
                        winner: match.result ? match.result.nick : null
                    })),
                    profile: profile
                }));
            });
        }
    }
}
