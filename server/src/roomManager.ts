import type { Room } from "../../shared/model/room.js";
import type { Player } from "./model/player.js";
import { ServerRoom } from "./model/serverRoom.js";
import { generateRandomCode } from "./utils.js";
import { Server } from "socket.io";
import { WebSocketMessage as WSM } from "../../shared/ws_types.js";
import { addPhaseTime, votePhaseTime } from "../../shared/config.js";
import { emitRoomUpdate } from "./websocket/websocketHelper.js";

/**
 * Global room storage
 * Maps room IDs to ServerRoom instances
 * @type {Record<string, ServerRoom>}
 */
export const rooms: Record<string, ServerRoom> = {};

/**
 * Create a new room with the given host
 *
 * Generates a unique room code and initializes a new ServerRoom.
 * The room starts in "lobby" phase and can accept players.
 *
 * @param {string} hostId - Player ID of the room host/creator
 * @returns {string} The unique room code
 */
export function createRoom(hostId: string): string {
    const roomId = generateRandomCode(); // TODO: check if code is already in use

    console.log(`Creating room with hostId: ${hostId}, roomId: ${roomId}`);

    const room = new ServerRoom(roomId, hostId);
    rooms[roomId] = room;
    return roomId;
}

/**
 * Add a player to an existing room
 *
 * Adds the player to the room's player list and returns the updated room state.
 * If the room doesn't exist, returns null and logs an error.
 *
 * @param {string} roomId - The room code
 * @param {Player} player - The player to add
 * @returns {ServerRoom | null} The ServerRoom data if successful, null if room doesn't exist or player already joined
 */
export function joinRoom(roomId: string, player: Player): ServerRoom | null {
    const serverRoom = getServerRoom(roomId);
    if (!serverRoom) {
        console.log(`Failed to join room: room ${roomId} does not exist`);
        return null;
    }
    if (serverRoom.players.includes(player)) {
        return null;
    }

    console.log(`Player ${player.id} (${player.name}) joining room ${roomId}`);
    serverRoom.players.push(player);
    return serverRoom;
}

/**
 * Get a room's shared data (safe to send to clients)
 *
 * Returns the room in the shared Room format, excluding server-only properties.
 * If the room doesn't exist, returns null.
 *
 * @param {string} roomId - The room code
 * @param {string} playerId - Id for the player the data is for
 * @returns {Room | null} The shared room data if found, null otherwise
 */
export function getRoom(roomId: string, playerId: string): Room | null {
    const room = getServerRoom(roomId);
    return room ? room.toRoom(playerId) : null;
}

/**
 * Get a room's ServerRoom instance
 *
 * Returns the internal ServerRoom, which includes server-only properties
 * like timeout tracking.
 *
 * @param {string} roomId - The room code
 * @returns {ServerRoom | null} The server room if found, null otherwise
 */
export function getServerRoom(roomId: string): ServerRoom | null {
    return rooms[roomId] || null;
}

/**
 * Remove a player from a room by ID
 *
 * Removes the player and automatically deletes the room if it becomes empty.
 * Returns true if the operation was successful, false if the room doesn't exist.
 *
 * @param {string} roomId - The room code
 * @param {string} playerId - The player ID to remove
 * @returns {boolean} True if successful (player existed), false if player or room doesn't exist
 */
export function removePlayerFromRoom(
    roomId: string,
    playerId: string,
): boolean {
    const room = getServerRoom(roomId);
    if (!room) return false;

    const playerIndex = room.players.findIndex((p) => p.id === playerId);
    if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
            delete rooms[roomId]; // TODO: add a function for that
            console.log(`Deleted room ${roomId}`);
        }
        return true;
    }
    return false;
}

/**
 * Transition a room to the add phase
 *
 * @param {ServerRoom} room - The server room object
 * @param {Server} wss - Socket.io server instance for broadcasting updates
 */
export function transitionToAddPhase(room: ServerRoom, wss: Server): void {
    room.phase = "add";
    const now = Date.now();
    room.phaseEndTime = now + addPhaseTime;

    // Timeout for auto transition
    const timeoutId = setTimeout(() => {
        if (room.phase !== "add") return;
        room.phase = "vote";
        room.clearTimeoutId("addPhaseTimeout");
        emitRoomUpdate(wss, room.id);
    }, addPhaseTime);

    room.setTimeoutId("addPhaseTimeout", timeoutId);
}

/**
 * Transition a room to the voting phase
 *
 * @param {ServerRoom} room - The server room object
 * @param {Server} wss - Socket.io server instance for broadcasting updates
 */
export function transitionToVotingPhase(room: ServerRoom, wss: Server): void {
    room.clearTimeoutId("addPhaseTimeout");
    room.phase = "vote";
    const now = Date.now();
    room.phaseEndTime = now + votePhaseTime;

    // Timeout for auto transition
    const timeoutId = setTimeout(() => {
        if (room.phase !== "vote") return;
        room.phase = "results";
        room.clearTimeoutId("votePhaseTimeout");
        emitRoomUpdate(wss, room.id);
    }, votePhaseTime);

    room.setTimeoutId("votePhaseTimeout", timeoutId);
}

/**
 * Finish the voting phase and transition to results
 *
 * @param {ServerRoom} room - The server room object
 */
export function finishVotingPhase(room: ServerRoom): void {
    room.phase = "results";
    room.clearTimeoutId("votePhaseTimeout");
}

/**
 * Reset a room back to the lobby phase
 *
 * Clears all active timeouts, resets phase to "lobby", and clears the
 * finished players list. Useful when transitioning from results back to lobby.
 * If the room doesn't exist, does nothing.
 *
 * @param {string} roomId - The room code
 */
export function resetToLobby(roomId: string) {
    const room = getServerRoom(roomId);
    if (!room) return;
    room.clearAllTimeouts();
    room.phase = "lobby";
    room.finishedPlayers = [];
    room.phaseEndTime = -1;
}
