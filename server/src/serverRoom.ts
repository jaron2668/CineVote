import type { Room } from "../../shared/model/room.js";

/**
 * Server-side room class that extends the shared Room interface
 *
 * This class is used internally on the server to track additional state
 * that should not be transmitted to clients. It implements the Room interface
 * to guarantee compatibility with the shared type system.
 *
 * When sending room data to clients, use the toRoom() method to convert
 * to the shared Room type, which excludes server-only properties.
 *
 * @class ServerRoom
 * @implements {Room}
 */
export class ServerRoom implements Room {
    id: string;
    hostId: string;
    players: any[];
    movies: Record<string, any>;
    phase: "lobby" | "add" | "vote" | "results";
    phaseEndTime: number;
    finishedPlayers: string[];

    /** Map to store and manage timeout IDs for automatic phase transitions */
    private timeoutIds: Map<string, NodeJS.Timeout>;

    /**
     * Create a new ServerRoom instance
     *
     * @constructor
     * @param {string} id - Unique room code
     * @param {string} hostId - Player ID of the host/creator
     */
    constructor(id: string, hostId: string) {
        this.id = id;
        this.hostId = hostId;
        this.players = [];
        this.movies = {};
        this.phase = "lobby";
        this.phaseEndTime = -1;
        this.finishedPlayers = [];
        this.timeoutIds = new Map();
    }

    /**
     * Store a timeout ID with a key for later reference and cleanup
     *
     * Any existing timeout with the same key will be overwritten.
     *
     * @param {string} key - Identifier for the timeout
     * @param {NodeJS.Timeout} timeoutId - The timeout ID from setTimeout()
     */
    setTimeoutId(key: string, timeoutId: NodeJS.Timeout): void {
        this.timeoutIds.set(key, timeoutId);
    }

    /**
     * Retrieve a timeout ID by key
     *
     * @param {string} key - The timeout identifier
     * @returns {NodeJS.Timeout | undefined} The timeout ID if found, undefined otherwise
     */
    getTimeoutId(key: string): NodeJS.Timeout | undefined {
        return this.timeoutIds.get(key);
    }

    /**
     * Removes a specific timeout by key from tracking.
     *
     * This does not cancel the timeout.
     *
     * @param key - The timeout identifier to delete
     */
    removeTimeoutId(key: string): void {
        this.timeoutIds.delete(key);
    }

    /**
     * Clear a specific timeout by key and remove it from tracking
     *
     * This cancels the timeout so it won't execute, and removes it from
     * the internal Map. If the key does not exist it does nothing.
     *
     * @param {string} key - The timeout identifier to clear
     */
    clearTimeoutId(key: string): void {
        const timeoutId = this.timeoutIds.get(key);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeoutIds.delete(key);
        }
    }

    /**
     * Clear all tracked timeouts
     */
    clearAllTimeouts(): void {
        this.timeoutIds.forEach((timeoutId) => {
            clearTimeout(timeoutId);
        });
        this.timeoutIds.clear();
    }

    /**
     * Convert to shared Room type for sending to clients
     *
     * Returns only the properties defined in the Room interface, excluding
     * all server-only properties like timeoutIds.
     *
     * @returns {Room} A new Room object with only the shared properties
     */
    toRoom(): Room {
        return {
            id: this.id,
            hostId: this.hostId,
            players: this.players,
            movies: this.movies,
            phase: this.phase,
            phaseEndTime: this.phaseEndTime,
            finishedPlayers: this.finishedPlayers,
        };
    }
}
