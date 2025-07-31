import type { /*Game,*/ User, /*User_f*/ } from "../defines/types";

interface Match {
    player1: User;
    player2: User;
    result: User | null;
}

interface Tournament {
  name: string;
  players: User[];
  matches: Match[];
  started: boolean;
  addPlayer(player: User): void;
  start(): void;
  generateMatches(): Match[];
  reportResult(matchIndex: number, winner: User | null): void;
  getResults(): Match[];
}

class TournamentImpl implements Tournament {
  name: string;
  players: User[] = [];
  matches: Match[] = [];
  started: boolean = false;

  constructor(name: string) {
    this.name = name;
  }

  addPlayer(player: User): void {
    if (this.started) throw new Error("Tournament already started");
    this.players.push(player);
  }

  start(): void {
    if (this.players.length != 3) throw new Error("Need 3 players");
    this.started = true;
    this.matches = this.generateMatches();
  }

  generateMatches(): Match[] {
    let matches: Match[] = [];
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        matches.push({
          player1: this.players[i],
          player2: this.players[j],
          result: null
        });
      }
    }
    return matches;
  }

  reportResult(matchIndex: number, winner: User | null): void {
    if (!this.started) throw new Error("Tournament not started");
    if (!this.matches[matchIndex]) throw new Error("Invalid match");
    this.matches[matchIndex].result = winner;
  }

  getResults(): Match[] {
    return this.matches;
  }
}

export default TournamentImpl;