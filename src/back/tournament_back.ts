import type { User } from "../defines/types";

interface Match {
    player1: User;
    player2: User;
    result: User | null;
    gameId?: number;
}

export class Tournament {
    name: string;
    players: User[] = [];
    matches: Match[] = [];
    started: boolean = false;

    constructor(name: string) {
        this.name = name;
    }

    addPlayer(player: User): void {
        if (!this.started && this.players.length < 3 && !this.players.some(p => p.id === player.id)) {
            this.players.push(player);
        }
    }

    startTournament(): void {
        if (this.players.length == 3) {
            this.started = true;
            this.matches = this.generateMatches();
        }
    }

    generateMatches(): Match[] {
        let matches: Match[] = [];
        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) {
                matches.push({
                    player1: this.players[i],
                    player2: this.players[j],
                    result: null,
                    gameId: undefined // gameId заполняется в первом файле
                });
            }
        }
        return matches;
    }

    reportResult(matchIndex: number, winner: User | null): void {
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

        if (this.matches.every(match => match.result !== null)) {
            const winCounts = new Map<number, number>();
            this.players.forEach(player => winCounts.set(player.id, 0));
            this.matches.forEach(match => {
                if (match.result) {
                    winCounts.set(match.result.id, (winCounts.get(match.result.id) || 0) + 1);
                }
            });

            let maxWins = 0;
            let tournamentWinner: User | null = null;
            for (const [playerId, wins] of winCounts) {
                if (wins > maxWins) {
                    maxWins = wins;
                    tournamentWinner = this.players.find(p => p.id === playerId) || null;
                } else if (wins === maxWins && wins > 0) {
                    tournamentWinner = null; // Ничья
                }
            }

            this.players.forEach(player => {
                player.gameSocket?.send(JSON.stringify({
                    type: "TournamentResult",
                    tournamentId: this.name,
                    winner: tournamentWinner ? tournamentWinner.nick : null,
                    results: this.getResults().map(match => ({
                        player1: match.player1.nick,
                        player2: match.player2.nick,
                        winner: match.result ? match.result.nick : null
                    }))
                }));
            });
        }
    }
}