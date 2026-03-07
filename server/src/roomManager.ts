import type { Room } from "../../shared/model/room.js";
import type { Player } from "../../shared/model/player.js";
import { generateRandomCode } from "./utils.js";

export const rooms: Record<string, Room> = {};

export function createRoom(host: Player): string {
    const roomId = generateRandomCode(); // TODO: check if code is already in use

    const room: Room = {
        id: roomId,
        host: host,
        players: [host],
        movies: {},
        phase: "lobby",
        finishedPlayers: [],
    };

    rooms[roomId] = room;
    return roomId;
}

export function joinRoom(roomId: string, player: Player): Room | null {
    const room = rooms[roomId];
    if (!room) return null;

    room.players.push(player);
    return room;
}

export function getRoom(roomId: string): Room | null {
    return rooms[roomId] || null;
}

export function removePlayerFromRoom(roomId: string, playerId: string): void {
    const room = rooms[roomId];
    if (!room) return;

    const playerIndex = room.players.findIndex((p) => p.id === playerId);
    if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
            delete rooms[roomId];
        }
    }
}
