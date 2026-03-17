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
} from "../../shared/ws_types.js";
import {
    rooms,
    createRoom,
    joinRoom,
    getRoom,
    removePlayerFromRoom,
    resetToLobby,
} from "./roomManager.js";
import { addPhaseTime } from "../../shared/config.js";

function emitRoomUpdate(wss: Server, roomId: string, room: any): void {
    wss.to(roomId).emit(WSM.RoomUpdate, room);
}

function isHostAuth(ws: any, room: any): boolean {
    return room.hostId === ws.data.playerId;
}

function isPhase(room: any, expectedPhase: string): boolean {
    return room.phase === expectedPhase;
}

export function setupWebSocketHandlers(wss: Server): void {
    wss.on("connection", (ws) => {
        console.log(
            `Socket connection (socket id: ${ws.id}, stable id: ${ws.data.playerId})`,
        );

        // disconnect handling
        /*ws.on("disconnect", () => {
            for (const roomId in rooms) {
                const room = getRoom(roomId);
                if (room!.phase !== "lobby") continue;
                removePlayerFromRoom(roomId, ws.data.playerId);
                console.log(
                    `Player ${ws.data.playerId} disconnected from room ${roomId}`,
                );
                if (room) {
                    wss.to(roomId).emit(WSM.RoomUpdate, room);
                }
            }
        });*/

        // a player creates a new room
        ws.on(
            WSM.CreateRoom,
            (
                {} /*playerId*/ : CreateRoomData,
                callback: CreateRoomCallback,
            ) => {
                console.log(`Creating a room for player ${ws.data.playerId}`);
                const roomId = createRoom(ws.data.playerId);

                // add player websocket to room
                //ws.join(roomId);

                // return room id to callback
                callback(roomId);

                // update room clientside
                //const room = getRoom(roomId);
                //if (room) {
                //    wss.to(roomId).emit(WSM.RoomUpdate, room);
                //}
            },
        );

        ws.on(
            WSM.GetPlayerInRoomStatus,
            (
                { roomId, playerId }: GetPlayerInRoomStatusData,
                cb: GetPlayerInRoomStatusCallback,
            ) => {
                const room = rooms[roomId];
                if (!room) {
                    cb("invalid-room");
                    return;
                }

                const joined = room.players.some(
                    (player) => player.id === playerId,
                );
                if (joined) cb("joined");
                else cb("not-joined");
            },
        );

        // player join room
        ws.on(WSM.JoinRoom, ({ roomId, playerName }: JoinRoomData) => {
            const player: Player = {
                id: ws.data.playerId,
                name: playerName,
            };
            const room = joinRoom(roomId, player);

            if (!room) return;

            // add player websocket to room
            ws.join(roomId);

            // update room for clients
            emitRoomUpdate(wss, roomId, room);
        });

        // player rejoins room
        ws.on(WSM.RejoinRoom, ({ roomId }: RejoinRoomData) => {
            const room = rooms[roomId];
            if (!room) return;
            const joined = room.players.some(
                (player) => player.id === ws.data.playerId,
            );
            if (!joined) return;

            ws.join(roomId);

            wss.to(ws.id).emit(WSM.RoomUpdate, room); // players might get movie list early but it doesn't really matter
        });

        // player leaves room
        ws.on(WSM.LeaveRoom, ({ roomId }: LeaveRoomData) => {
            const room = getRoom(roomId);
            if (!room) return;

            if (removePlayerFromRoom(room.id, ws.data.playerId)) {
                console.log(`Player ${ws.data.playerId} left room ${roomId}`);
                ws.leave(roomId);
                emitRoomUpdate(wss, roomId, room);
            }
        });

        // host switches to add phase
        ws.on(WSM.StartAddPhase, ({ roomId }: StartAddPhaseData) => {
            const room = getRoom(roomId);
            if (!room) return;
            if (!isHostAuth(ws, room)) return;
            if (!isPhase(room, "lobby")) return;

            room.phase = "add";
            const now = Date.now();
            room.phaseEndTime = now + addPhaseTime;

            setTimeout(() => {
                const room = getRoom(roomId);
                if (!room || !isPhase(room, "add")) return;
                room.phase = "vote";
                emitRoomUpdate(wss, roomId, room);
            }, addPhaseTime);

            emitRoomUpdate(wss, roomId, room);
        });

        // player adds a movie
        ws.on(WSM.AddMovie, ({ roomId, title }: AddMovieData) => {
            const room = getRoom(roomId);
            if (!room) return;
            // TODO: check if player is in that room

            const movie: Movie = {
                id: crypto.randomUUID(),
                title,
                votes: 0,
            };

            room.movies[movie.id] = movie;
        });

        // host switches to voting phase
        ws.on(WSM.StartVoting, ({ roomId }: StartVotingData) => {
            const room = getRoom(roomId);
            if (!room) {
                console.log("room does not exist.");
                return;
            }
            if (!isHostAuth(ws, room)) {
                console.log("message is not from host.");
                return;
            }
            if (!isPhase(room, "add")) {
                console.log("current phase is not add phase.");
                return;
            }

            room.phase = "vote";
            emitRoomUpdate(wss, roomId, room);
        });

        // player vote for a single movie
        ws.on(WSM.PlayerVote, ({ roomId, movieId, vote }: PlayerVoteData) => {
            const room = getRoom(roomId);
            if (!room) return;
            if (room.phase !== "vote") return;

            const movie = room.movies[movieId];
            if (!movie) return;
            // TODO: check if player is in room and has not already voted for that movie

            movie.votes += vote;
        });

        // player finished voting for all movies
        ws.on(
            WSM.PlayerFinishedVoting,
            ({ roomId }: PlayerFinishedVotingData) => {
                const room = getRoom(roomId);
                if (!room) return;
                if (!isPhase(room, "vote")) return;
                // TODO: check if player was already finished

                room.finishedPlayers.push(ws.data.playerId);

                // switch to next phase if all players finished voting
                if (room.finishedPlayers.length === room.players.length) {
                    room.phase = "results";
                    emitRoomUpdate(wss, roomId, room);
                }
            },
        );

        // host forces the end of voting phase
        ws.on(WSM.ForceFinishVoting, ({ roomId }: ForceFinishVotingData) => {
            const room = getRoom(roomId);
            if (!room) return;
            if (!isHostAuth(ws, room)) return;
            if (!isPhase(room, "vote")) return;
            room.phase = "results";
            emitRoomUpdate(wss, roomId, room);
        });

        ws.on(WSM.BackToLobbyState, ({ roomId }: BackToLobbyStateData) => {
            const room = getRoom(roomId);
            if (!room) return;
            if (!isHostAuth(ws, room)) return;
            resetToLobby(roomId);
            emitRoomUpdate(wss, roomId, room);
        });
    });
}
