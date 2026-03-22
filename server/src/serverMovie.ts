import type { Movie } from "../../shared/model/movie.js";

/**
 * Server-side representation of a movie in a voting room.
 * Extends the shared Movie model with vote tracking per player.
 * @class
 * @implements {Movie}
 */
export class ServerMovie implements Movie {
    id: string;
    title: string;
    votes: number;
    playersVoted: string[];

    /**
     * Creates a new ServerMovie instance with no votes.
     * @constructor
     * @param {string} id - Identifier
     * @param {string} title - Title of the movie
     */
    constructor(id: string, title: string) {
        this.id = id;
        this.title = title;
        this.votes = 0;
        this.playersVoted = [];
    }

    /**
     * Converts ServerMovie to a Movie object for client transmission.
     * Excludes some server-only data.
     * @returns {Movie} Movie object
     */
    toMovie(): Movie {
        return {
            id: this.id,
            title: this.title,
            votes: this.votes,
        };
    }
}
