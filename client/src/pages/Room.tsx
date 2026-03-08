import { useEffect, useState } from "react";
import ws from "../socket.js";
import {
    WebSocketMessage as WSM,
    type GetPlayerInRoomStatusCallback,
    type GetPlayerInRoomStatusData,
    type RejoinRoomData,
} from "../../../shared/ws_types";
import { useNavigate, useParams } from "react-router-dom";
import { playerId } from "../socket.js";
import type { Room as RoomModel } from "../../../shared/model/room.js";
import Lobby from "../components/Lobby.js";
import AddMovies from "../components/AddMovies.js";
import Voting from "../components/Voting.js";
import Results from "../components/Results.js";
import CharacterCreator from "../components/CharacterCreator.js";

const Room = () => {
    const { roomCode } = useParams<{ roomCode: string }>();
    const [room, setRoom] = useState<RoomModel | null>(null);
    const [inRoom, setInRoom] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        ws.on(WSM.RoomUpdate, (room) => {
            setRoom(room);
        });
    }, []);

    useEffect(() => {
        const data: GetPlayerInRoomStatusData = {
            roomId: roomCode!,
            playerId,
        };
        const cb: GetPlayerInRoomStatusCallback = (result) => {
            console.log(`joined result: ${result}`);
            if (result === "joined") {
                const rejoinData: RejoinRoomData = {
                    roomId: roomCode!,
                };
                ws.emit(WSM.RejoinRoom, rejoinData);
                setInRoom(true);
            } else if (result === "invalid-room") {
                navigate("/");
            }
        };
        ws.emit(WSM.GetPlayerInRoomStatus, data, cb);
    }, [roomCode, navigate]);

    if (!inRoom) {
        return <CharacterCreator roomId={roomCode!} setInRoom={setInRoom} />;
    }

    if (!room) {
        return <div>Loading...</div>;
    }

    if (room.phase === "lobby") {
        return <Lobby room={room} />;
    }

    if (room.phase === "add") {
        return <AddMovies room={room} />;
    }

    if (room.phase === "vote") {
        return <Voting room={room} />;
    }

    if (room.phase === "results") {
        return <Results room={room} />;
    }

    return (
        <div className="app-container">
            <div>Unknown phase</div>
        </div>
    );
};

export default Room;
