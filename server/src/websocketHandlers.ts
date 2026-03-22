import { Server } from "socket.io";
import type { Player } from "../../shared/model/player.js";
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
import { ServerMovie } from "./serverMovie.js";

// ========================
// === Helper Functions ===
// ========================

/**
 * Emit room state updates to all connected players in a room.
 * Handles conversion from ServerRoom to clientside Room format.
 * @param wss - Socket.IO server instance
 * @param roomId - ID of the room
 * @param room - Room data (ServerRoom or Room format)
 */
function emitRoomUpdate(
    wss: Server,
    roomId: string,
    room: ServerRoom | Room,
): void {
    if ("toRoom" in room) {
        // server room
        wss.to(roomId).emit(WSM.RoomUpdate, room.toRoom());
    } else {
        // client room
        wss.to(roomId).emit(WSM.RoomUpdate, room);
    }
}

/**
 * Checks if the requesting player is the room host.
 * @param ws - Socket connection with player ID in ws.data.playerId
 * @param room - (Server)Room to check
 * @returns true if player is host, false otherwise
 */
function isHostAuth(ws: any, room: ServerRoom | Room): boolean {
    return room.hostId === ws.data.playerId;
}

/**
 * Checks if room is in a specific phase.
 * @param room - (Server)Room to check
 * @param expectedPhase - Phase to check for ("lobby", "add", "vote", "results")
 * @returns true if room is in expected phase, false otherwise
 */
function isPhase(room: ServerRoom | Room, expectedPhase: string): boolean {
    return room.phase === expectedPhase;
}

// =========================
// === Handler Functions ===
// =========================

/**
 * Handler: Player creates a new room
 * Creates a room with the requesting player as the host.
 * @handler WSM.CreateRoom
 * @param {CreateRoomCallback} callback - Called with the new roomId
 */
const handleCreateRoom =
    (wss: Server, ws: any) =>
    ({} /*playerId*/ : CreateRoomData, callback: CreateRoomCallback) => {
        console.log(`Creating a room for player ${ws.data.playerId}`);
        const roomId = createRoom(ws.data.playerId);
        callback(roomId);
    };

/**
 * Handler: Request player status
 * Check if a player has joined a specific room.
 * @handler WSM.GetPlayerInRoomStatus
 * @param {string} roomId - Room ID to check
 * @param {string} playerId - Player ID to check
 * @param {GetPlayerInRoomStatusCallback} cb - Callback with status: "joined", "not-joined", or "invalid-room"
 */
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

/**
 * Handler: Player joins a room.
 * Adds requesting player to the specified room and broadcasts updated room state.
 * Room must be in lobby phase to join.
 * @handler WSM.JoinRoom
 * @param {string} roomId - ID of room to join
 * @param {string} playerName - Display name for the joining player
 * @returns void
 */
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

/**
 * Handler: Player reconnects to a room they previously joined.
 * Validates player is in room, then sends current room state to reconnecting player.
 * @handler WSM.RejoinRoom
 * @param {string} roomId - ID of room to rejoin
 * @note TODO: Prevent errors on multiple rapid rejoin attempts
 */
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

/**
 * Handler: Player voluntarily leaves a room.
 * Removes player from room and broadcasts updated state to remaining players.
 * @handler WSM.LeaveRoom
 * @param {string} roomId - ID of room to leave
 */
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

/**
 * Handler: Host starts the movie add phase.
 * Transitions room from lobby to add phase where players can suggest movies.
 * @handler WSM.StartAddPhase
 * @param {string} roomId - ID of room to transition
 */
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

/**
 * Handler: Player suggests a movie during the add phase.
 * Creates a new movie entry with 0 votes and adds it to the room's movie collection.
 * @handler WSM.AddMovie
 * @param {string} roomId - ID of room
 * @param {string} title - Movie title to add
 * @note Does not broadcast update; client should wait for room state broadcast
 */
const handleAddMovie =
    (wss: Server, ws: any) =>
    ({ roomId, title }: AddMovieData) => {
        const room = getServerRoom(roomId);
        if (!room) return;

        const movie: ServerMovie = new ServerMovie(crypto.randomUUID(), title);

        room.movies[movie.id] = movie;
    };

/**
 * Handler: Host starts the voting phase.
 * Transitions room from add phase to vote phase where players vote on suggested movies.
 * @handler WSM.StartVoting
 * @param {string} roomId - ID of room to transition
 */
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

/**
 * Handler: Player votes for a movie.
 * @handler WSM.PlayerVote
 * @param {string} roomId - ID of room
 * @param {string} movieId - ID of movie to vote on
 * @param {number} vote - Vote value (+1, 0, or -1)
 */
const handlePlayerVote =
    (wss: Server, ws: any) =>
    ({ roomId, movieId, vote }: PlayerVoteData) => {
        const room = getServerRoom(roomId);
        if (!room) return;
        if (room.phase !== "vote") return;
        if (vote < -2 || vote > 2) {
            console.log(
                `Player ${ws.data.playerId} tried to vote with invalid value ${vote}`,
            );
            return;
        }

        const movie = room.movies[movieId];
        const playerId = ws.data.playerId;
        if (!movie) return;
        if (movie.playersVoted.includes(playerId)) return;

        movie.playersVoted.push(playerId);
        movie.votes += vote;
    };

/**
 * Handler: Player signals they have finished voting.
 * Tracks which players have completed voting; when all players finish,
 * automatically transitions to results phase.
 * @handler WSM.PlayerFinishedVoting
 * @param {string} roomId - ID of room
 */
const handlePlayerFinishedVoting =
    (wss: Server, ws: any) =>
    ({ roomId }: PlayerFinishedVotingData) => {
        const room = getServerRoom(roomId);
        if (!room) return;
        if (!isPhase(room, "vote")) return;
        if (room.finishedPlayers.includes(ws.data.playerId)) return;

        room.finishedPlayers.push(ws.data.playerId);

        if (room.finishedPlayers.length === room.players.length) {
            finishVotingPhase(room);
            emitRoomUpdate(wss, roomId, room);
        }
    };

/**
 * Handler: Host forces the voting phase to end.
 * Transitions room to results phase.
 * @handler WSM.ForceFinishVoting
 * @param {string} roomId - ID of room
 */
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

/**
 * Handler: Host resets room back to lobby phase.
 * Clears all movies and votes, allows players to start a new voting round.
 * @handler WSM.BackToLobbyState
 * @param {string} roomId - ID of room to reset
 */
const handleBackToLobbyState =
    (wss: Server, ws: any) =>
    ({ roomId }: BackToLobbyStateData) => {
        const room = getServerRoom(roomId);
        if (!room) return;
        if (!isHostAuth(ws, room)) return;
        resetToLobby(roomId);
        emitRoomUpdate(wss, roomId, room);
    };

/**
 * Handler: Host kicks a player from the room.
 * Removes player from room and notifies them with PlayerKicked event.
 * @handler WSM.KickPlayer
 * @param {string} roomId - ID of room
 * @param {string} playerId - ID of player to kick
 */
const handleKickPlayer =
    (wss: Server, ws: any) =>
    async ({ roomId, playerId }: KickPlayerData) => {
        const room = getServerRoom(roomId);
        if (!room) return;
        if (!isHostAuth(ws, room)) return;
        if (room.phase !== "lobby") return;

        if (removePlayerFromRoom(roomId, playerId)) {
            console.log(`Player ${playerId} kicked from room ${roomId}`);
            // remove player socket from room
            const sockets = await wss.in(roomId).fetchSockets();

            for (const s of sockets) {
                // should only be one entry
                if (s.data.playerId === playerId) {
                    s.leave(roomId);
                    s.emit(WSM.PlayerKicked);
                    break;
                }
            }
            //wss.to(playerId).emit(WSM.PlayerKicked);
            emitRoomUpdate(wss, roomId, room);
        }
    };

// ======================
// === Setup Function ===
// ======================

/**
 * Sets up all WebSocket event handlers on the Socket.IO server.
 * Called once during server initialization to register event listeners.
 * @param {Server} wss - Socket.IO server instance
 */
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
