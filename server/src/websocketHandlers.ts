import { Server } from "socket.io";
import type { Player } from "../../shared/model/player.js";
import type { Movie } from "../../shared/model/movie.js";
import {
    WebSocketMessage as WSM,
    type CreateRoomData,
    type CreateRoomCallback,
    type JoinRoomData,
    type StartAddPhaseData,
    type AddMovieData,
    type StartVotingData,
    type PlayerVoteData,
    type PlayerFinishedVotingData,
    type ForceFinishVotingData,
    type GetPlayerInRoomStatusData,
    type GetPlayerInRoomStatusCallback,
    type RejoinRoomData,
    type BackToLobbyStateData,
    type LeaveRoomData,
    type KickPlayerData,
} from "../../shared/ws_types.js";
import {
    rooms,
    createRoom,
    joinRoom,
    getRoom,
    getServerRoom,
    removePlayerFromRoom,
    resetToLobby,
    transitionToAddPhase,
    transitionToVotingPhase,
    finishVotingPhase,
} from "./roomManager.js";
import type { Room } from "../../shared/model/room.js";
import type { ServerRoom } from "./serverRoom.js";

// helper fnctions
function emitRoomUpdate(wss: Server, roomId: string, room: any): void {
    // If it's a ServerRoom, convert to Room; if already a Room, use as-is
    const roomData = room.toRoom ? room.toRoom() : room;
    wss.to(roomId).emit(WSM.RoomUpdate, roomData);
}

function isHostAuth(ws: any, room: any): boolean {
    return room.hostId === ws.data.playerId;
}

function isPhase(room: any, expectedPhase: string): boolean {
    return room.phase === expectedPhase;
}

// handler functions
const handleCreateRoom =
    (wss: Server, ws: any) =>
    ({} /*playerId*/ : CreateRoomData, callback: CreateRoomCallback) => {
        console.log(`Creating a room for player ${ws.data.playerId}`);
        const roomId = createRoom(ws.data.playerId);
        callback(roomId);
    };

const handleGetPlayerInRoomStatus =
    (wss: Server, ws: any) =>
    (
        { roomId, playerId }: GetPlayerInRoomStatusData,
        cb: GetPlayerInRoomStatusCallback,
    ) => {
        const room = rooms[roomId];
        if (!room) {
            cb("invalid-room");
            return;
        }

        const joined = room.players.some((player) => player.id === playerId);
        if (joined) cb("joined");
        else cb("not-joined");
    };

const handleJoinRoom =
    (wss: Server, ws: any) =>
    ({ roomId, playerName }: JoinRoomData) => {
        const player: Player = {
            id: ws.data.playerId,
            name: playerName,
        };
        const room = joinRoom(roomId, player);

        if (!room) return;

        ws.join(roomId);
        emitRoomUpdate(wss, roomId, room);
    };

const handleRejoinRoom =
    (wss: Server, ws: any) =>
    ({ roomId }: RejoinRoomData) => {
        const room = rooms[roomId];
        if (!room) return;
        const joined = room.players.some(
            (player) => player.id === ws.data.playerId,
        );
        if (!joined) return;

        ws.join(roomId);
        wss.to(ws.id).emit(WSM.RoomUpdate, room);
    };

const handleLeaveRoom =
    (wss: Server, ws: any) =>
    ({ roomId }: LeaveRoomData) => {
        const room = getRoom(roomId);
        if (!room) return;

        if (removePlayerFromRoom(room.id, ws.data.playerId)) {
            console.log(`Player ${ws.data.playerId} left room ${roomId}`);
            ws.leave(roomId);
            emitRoomUpdate(wss, roomId, room);
        }
    };

const handleStartAddPhase =
    (wss: Server, ws: any) =>
    ({ roomId }: StartAddPhaseData) => {
        const serverRoom = getServerRoom(roomId);
        if (!serverRoom) return;
        if (!isHostAuth(ws, serverRoom)) return;
        if (!isPhase(serverRoom, "lobby")) return;

        transitionToAddPhase(serverRoom, wss);
        emitRoomUpdate(wss, roomId, serverRoom);
    };

const handleAddMovie =
    (wss: Server, ws: any) =>
    ({ roomId, title }: AddMovieData) => {
        const room = getServerRoom(roomId);
        if (!room) return;

        const movie: Movie = {
            id: crypto.randomUUID(),
            title,
            votes: 0,
        };

        room.movies[movie.id] = movie;
    };

const handleStartVoting =
    (wss: Server, ws: any) =>
    ({ roomId }: StartVotingData) => {
        const serverRoom = getServerRoom(roomId);
        if (!serverRoom) {
            console.log("room does not exist.");
            return;
        }
        if (!isHostAuth(ws, serverRoom)) {
            console.log("message is not from host.");
            return;
        }
        if (!isPhase(serverRoom, "add")) {
            console.log("current phase is not add phase.");
            return;
        }

        transitionToVotingPhase(serverRoom, wss);
        emitRoomUpdate(wss, roomId, serverRoom);
    };

const handlePlayerVote =
    (wss: Server, ws: any) =>
    ({ roomId, movieId, vote }: PlayerVoteData) => {
        const room = getServerRoom(roomId);
        if (!room) return;
        if (room.phase !== "vote") return;

        const movie = room.movies[movieId];
        if (!movie) return;

        movie.votes += vote;
    };

const handlePlayerFinishedVoting =
    (wss: Server, ws: any) =>
    ({ roomId }: PlayerFinishedVotingData) => {
        const room = getServerRoom(roomId);
        if (!room) return;
        if (!isPhase(room, "vote")) return;

        room.finishedPlayers.push(ws.data.playerId);

        if (room.finishedPlayers.length === room.players.length) {
            finishVotingPhase(room);
            emitRoomUpdate(wss, roomId, room);
        }
    };

const handleForceFinishVoting =
    (wss: Server, ws: any) =>
    ({ roomId }: ForceFinishVotingData) => {
        const room = getServerRoom(roomId);
        if (!room) return;
        if (!isHostAuth(ws, room)) return;
        if (!isPhase(room, "vote")) return;

        finishVotingPhase(room);
        emitRoomUpdate(wss, roomId, room);
    };

const handleBackToLobbyState =
    (wss: Server, ws: any) =>
    ({ roomId }: BackToLobbyStateData) => {
        const room = getServerRoom(roomId);
        if (!room) return;
        if (!isHostAuth(ws, room)) return;
        resetToLobby(roomId);
        emitRoomUpdate(wss, roomId, room);
    };

const handleKickPlayer =
    (wss: Server, ws: any) =>
    ({ roomId, playerId }: KickPlayerData) => {
        const room = getServerRoom(roomId);
        if (!room) return;
        if (!isHostAuth(ws, room)) return;
        if (room.phase !== "lobby") return;

        removePlayerFromRoom(roomId, playerId);
        wss.to(playerId).emit(WSM.PlayerKicked);
        emitRoomUpdate(wss, roomId, room);
    };

// === setup function ===
export function setupWebSocketHandlers(wss: Server): void {
    wss.on("connection", (ws) => {
        console.log(
            `Socket connection (socket id: ${ws.id}, stable id: ${ws.data.playerId})`,
        );

        ws.on(WSM.CreateRoom, handleCreateRoom(wss, ws));
        ws.on(WSM.GetPlayerInRoomStatus, handleGetPlayerInRoomStatus(wss, ws));
        ws.on(WSM.JoinRoom, handleJoinRoom(wss, ws));
        ws.on(WSM.RejoinRoom, handleRejoinRoom(wss, ws));
        ws.on(WSM.LeaveRoom, handleLeaveRoom(wss, ws));
        ws.on(WSM.StartAddPhase, handleStartAddPhase(wss, ws));
        ws.on(WSM.AddMovie, handleAddMovie(wss, ws));
        ws.on(WSM.StartVoting, handleStartVoting(wss, ws));
        ws.on(WSM.PlayerVote, handlePlayerVote(wss, ws));
        ws.on(WSM.PlayerFinishedVoting, handlePlayerFinishedVoting(wss, ws));
        ws.on(WSM.ForceFinishVoting, handleForceFinishVoting(wss, ws));
        ws.on(WSM.BackToLobbyState, handleBackToLobbyState(wss, ws));
        ws.on(WSM.KickPlayer, handleKickPlayer(wss, ws));
    });
}
