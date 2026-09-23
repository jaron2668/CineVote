import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ws from "../socket.js";
import {
    WebSocketMessage as WSM,
    type CreateRoomCallback,
    type CreateRoomData,
    type GetRoomStatusCallback,
    type GetRoomStatusData,
} from "../../../shared/ws_types.js";

export default function JoinOrCreate() {
    //const [name, setName] = useState<string>("");
    const [roomCodeInput, setRoomCodeInput] = useState<string>("");

    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    function showRoomNotFound() {
        setError("Room does not exist");

        setTimeout(() => {
            setError(null);
        }, 3000);
    }

    function createRoom() {
        console.log("create room clicked.");
        const data: CreateRoomData = {
            //playerId,
        };
        const cb: CreateRoomCallback = (roomId: string) => {
            console.log(`Created room ${roomId}.`);
            navigate(`/room/${roomId}`);
        };
        ws.emit(WSM.CreateRoom, data, cb);
        console.log("post send");
    }

    function joinRoom() {
        /*const data: JoinRoomData = {
            roomId: roomCodeInput,
            playerName: name,
        };
        ws.emit(WSM.JoinRoom, data);*/
        const code = roomCodeInput;
        const data: GetRoomStatusData = {
            roomId: code,
        };
        const cb: GetRoomStatusCallback = (result) => {
            switch (result) {
                case "non-existent":
                    showRoomNotFound();
                    break;
                case "lobby":
                    navigate(`/room/${code}`);
                    break;
                case "ingame":
                    console.log("room is ingame. joining aborted");
                    break;
                default:
                    console.log("unknown room status");
                    break;
            }
        };

        ws.emit(WSM.GetRoomStatus, data, cb);
    }

    return (
        <div className="app-container">
            <h1>CineVote</h1>

            {/*<input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />*/}

            <button onClick={createRoom}>Create Room</button>

            <input
                placeholder="Room Code"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
            />

            <button onClick={joinRoom} disabled={!roomCodeInput.trim()}>
                Join
            </button>

            {error && <p className="error-text">{error}</p>}
        </div>
    );
}
