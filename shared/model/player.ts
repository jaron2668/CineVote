/**
 * Represents a player in a CineVote room
 * 
 * @interface Player
 * @property {string} id - Unique identifier for the player (stable across reconnections)
 * @property {string} name - Display name chosen by the player
 */
export interface Player {
    id: string;
    name: string;
}
