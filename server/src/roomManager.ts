import type { Room } from "../../shared/model/room.js";
import type { Player } from "../../shared/model/player.js";
import { generateRandomCode } from "./utils.js";

export const rooms: Record<string, Room> = {};

export function createRoom(hostId: string): string {
    const roomId = generateRandomCode(); // TODO: check if code is already in use

    console.log(`Creating room with hostId: ${hostId}, roomId: ${roomId}`);

    const room: Room = {
        id: roomId,
        hostId,
        players: [],
        movies: {},
        phase: "lobby",
        phaseEndTime: -1,
        finishedPlayers: [],
    };

    rooms[roomId] = room;
    return roomId;
}

export function joinRoom(roomId: string, player: Player): Room | null {
    const room = rooms[roomId];
    if (!room) {
        console.log(`Failed to join room: room ${roomId} does not exist`);
        return null;
    }

    console.log(`Player ${player.id} (${player.name}) joining room ${roomId}`);
    room.players.push(player);
    return room;
}

export function getRoom(roomId: string): Room | null {
    return rooms[roomId] || null;
}

export function removePlayerFromRoom(
    roomId: string,
    playerId: string,
): boolean {
    const room = rooms[roomId];
    if (!room) return false;

    const playerIndex = room.players.findIndex((p) => p.id === playerId);
    if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
            delete rooms[roomId];
            console.log(`Deleted room ${roomId}`);
        }
    }
    return true;
}

export function resetToLobby(roomId: string) {
    const room = getRoom(roomId);
    if (!room) return;
    room.phase = "lobby";
    room.finishedPlayers = [];
    room.phaseEndTime = -1;
}
