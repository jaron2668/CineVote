import type { Player } from "./player.js";
import type { Movie } from "./movie.js";

/**
 * Represents a CineVote room that is shared between server and clients
 * This interface defines the data that is transmitted to clients
 * 
 * @interface Room
 * @property {string} id - Unique room code (4-6 alphanumeric characters)
 * @property {string} hostId - Player ID of the room host/creator
 * @property {Player[]} players - List of all players currently in the room
 * @property {Record<string, Movie>} movies - Dictionary of movies, keyed by movie ID
 * @property {Room["phase"]} phase - Current phase of the room
 *                                    "lobby" - Waiting for players to join, no phase active
 *                                    "add" - Players adding movie suggestions
 *                                    "vote" - Players voting on movies
 *                                    "results" - Showing final voting results
 * @property {number} phaseEndTime - Timestamp when current phase auto-transitions (milliseconds)
 *                                    -1 if no auto-transition scheduled
 * @property {string[]} finishedPlayers - Array of player IDs who finished voting in vote phase
 */
export interface Room {
    id: string;
    hostId: string;
    players: Player[];
    movies: Record<string, Movie>;

    phase: "lobby" | "add" | "vote" | "results";
    phaseEndTime: number;

    finishedPlayers: string[]; // id's of players that finished voting
}
