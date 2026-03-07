import { useState } from "react";
import ws from "../socket.js";
import {
    WebSocketMessage as WSM,
    type CreateRoomCallback,
    type CreateRoomData,
    type JoinRoomData,
} from "../../../shared/ws_types.js";

export default function JoinOrCreate() {
    const [name, setName] = useState<string>("");
    const [roomCodeInput, setRoomCodeInput] = useState<string>("");

    function createRoom() {
        console.log("create room clicked.");
        const data: CreateRoomData = {
            playerName: name,
        };
        const cb: CreateRoomCallback = (roomId: string) => {
            console.log(`Joined room ${roomId}.`);
        };
        ws.emit(WSM.CreateRoom, data, cb);
        console.log("post send");
    }

    function joinRoom() {
        const data: JoinRoomData = {
            roomId: roomCodeInput,
            playerName: name,
        };
        ws.emit(WSM.JoinRoom, data);
    }

    return (
        <div className="app-container">
            <h1>CineVote</h1>

            <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <button onClick={createRoom} disabled={!name.trim()}>
                Create Room
            </button>

            <input
                placeholder="Room Code"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
            />

            <button
                onClick={joinRoom}
                disabled={!name.trim() || !roomCodeInput.trim()}
            >
                Join
            </button>
        </div>
    );
}
