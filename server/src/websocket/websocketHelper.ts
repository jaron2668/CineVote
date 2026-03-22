import { Server } from "socket.io";
import { WebSocketMessage as WSM } from "../../../shared/ws_types.js";
import type { Room } from "../../../shared/model/room.js";
import type { ServerRoom } from "../model/serverRoom.js";
import { getServerRoom } from "../roomManager.js";

// ========================
// === Helper Functions ===
// ========================

/**
 * Emit room state updates to all connected players in a room.
 * @param wss - Socket.IO server instance
 * @param roomId - ID of the room
 */
export function emitRoomUpdate(wss: Server, roomId: string): void {
    const serverRoom = getServerRoom(roomId);
    if (!serverRoom) {
        console.log(
            `Tried to emit a room update for non-existant ServerRoom with id ${roomId}`,
        );
        return;
    }
    // Get all sockets in the room
    const sockets = wss.sockets.adapter.rooms.get(roomId);

    if (!sockets) return;
    // For each socket create personalized data and emit the update
    for (const socketId of sockets) {
        const ws = wss.sockets.sockets.get(socketId);
        if (!ws) continue;
        // Create data and emit update
        const data = serverRoom.toRoom(ws.data.playerId);
        ws.emit(WSM.RoomUpdate, data);
    }
}

/**
 * Checks if the requesting player is the room host.
 * @param ws - Socket connection with player ID in ws.data.playerId
 * @param room - ServerRoom to check
 * @returns true if player is host, false otherwise
 */
export function isHostAuth(ws: any, room: ServerRoom): boolean {
    return room.hostId === ws.data.playerId;
}

/**
 * Checks if room is in a specific phase.
 * @param room - (Server)Room to check
 * @param expectedPhase - Phase to check for ("lobby", "add", "vote", "results")
 * @returns true if room is in expected phase, false otherwise
 */
export function isPhase(
    room: ServerRoom | Room,
    expectedPhase: string,
): boolean {
    return room.phase === expectedPhase;
}
