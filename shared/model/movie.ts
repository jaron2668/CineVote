/**
 * Represents a movie suggestion in a CineVote room
 *
 * @interface Movie
 * @property {string} id - Unique identifier for the movie (UUID)
 * @property {string} title - Title of the movie
 * @property {number} votes - Accumulated vote count from all players
 */
export interface Movie {
    id: string;
    title: string;
    votes: number;
}
