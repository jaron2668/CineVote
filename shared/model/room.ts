import type { Player } from "../../server/src/model/player.js";
import type { Movie } from "./movie.js";

/**
 * Represents a CineVote the room information that is transmitted to clients
 *
 * @interface Room
 * @property {string} id - Unique room code (4-6 alphanumeric characters)
 * @property {boolean} host - True if player is host
 * @property {string[]} playerNames - List of all player names
 * @property {Record<string, Movie>} movies - Dictionary of movies, keyed by movie ID
 * @property {Room["phase"]} phase - Current phase of the room
 *                                    "lobby" - Waiting for players to join, no phase active
 *                                    "add" - Players adding movie suggestions
 *                                    "vote" - Players voting on movies
 *                                    "results" - Showing final voting results
 * @property {number} phaseEndTime - Timestamp when current phase auto-transitions (milliseconds since Jan 1, 1970)
 *                                    -1 if no auto-transition scheduled
 * @property {number} finishedPlayers - Number of players who finished the current phase
 */
export interface Room {
    id: string;
    host: boolean;
    players: string[];
    movies: Record<string, Movie>;

    phase: "lobby" | "add" | "vote" | "results";
    phaseEndTime: number;

    finishedPlayers: number;
}
