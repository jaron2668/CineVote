import type { Player } from "./player.js";
import type { Movie } from "./movie.js";

export interface Room {
    id: string;
    host: Player;
    players: Player[];
    movies: Record<string, Movie>;

    phase: "lobby" | "add" | "vote" | "results";

    finishedPlayers: string[]; // id's of players that finished voting
}
