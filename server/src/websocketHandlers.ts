import { Server } from "socket.io";
import type { Room } from "../../shared/model/room.js";
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
} from "../../shared/ws_types.js";
import { rooms, createRoom, joinRoom, getRoom } from "./roomManager.js";

export function setupWebSocketHandlers(wss: Server): void {
    wss.on("connection", (ws) => {
        console.log(
            `Socket connection (socket id: ${ws.id}, stable id: ${ws.data.playerId})`,
        );

        // disconnect handling
        /*ws.on("disconnect", () => {
            for (const roomId in rooms) {
                removePlayerFromRoom(roomId, ws.data.playerId);
                const room = getRoom(roomId);
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
            wss.to(roomId).emit(WSM.RoomUpdate, room);
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

        // host switches to add phase
        ws.on(WSM.StartAddPhase, ({ roomId }: StartAddPhaseData) => {
            const room = getRoom(roomId);
            if (!room) return;
            if (room.hostId !== ws.data.playerId) return;
            if (room.phase !== "lobby") return;

            room.phase = "add";
            wss.to(roomId).emit(WSM.RoomUpdate, room);
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
            if (room.hostId !== ws.data.playerId) {
                console.log("message is not from host.");
                return;
            }
            if (room.phase !== "add") {
                console.log("current phase is not add phase.");
                return;
            }

            room.phase = "vote";
            wss.to(roomId).emit(WSM.RoomUpdate, room);
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
                if (room.phase !== "vote") return;
                // TODO: check if player was already finished

                room.finishedPlayers.push(ws.data.playerId);

                // switch to next phase if all players finished voting
                if (room.finishedPlayers.length === room.players.length) {
                    room.phase = "results";
                    wss.to(roomId).emit(WSM.RoomUpdate, room);
                }
            },
        );

        // host forces the end of voting phase
        ws.on(WSM.ForceFinishVoting, ({ roomId }: ForceFinishVotingData) => {
            const room = getRoom(roomId);
            if (!room) return;
            if (room.hostId !== ws.data.playerId) return;
            if (room.phase !== "vote") return;
            room.phase = "results";
            wss.to(roomId).emit(WSM.RoomUpdate, room);
        });

        ws.on(WSM.BackToLobbyState, ({ roomId }: BackToLobbyStateData) => {
            const room = rooms[roomId];
            if (!room) return;
            if (ws.data.playerId !== room.hostId) return;
            room.phase = "lobby";
            room.finishedPlayers = [];
            wss.to(roomId).emit(WSM.RoomUpdate, room);
        });
    });
}
