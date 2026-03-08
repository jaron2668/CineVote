import { useState } from "react";
import ws from "../socket.js";
import {
    WebSocketMessage as WSM,
    type JoinRoomData,
} from "../../../shared/ws_types";

interface Props {
    roomId: string;
    setInRoom: React.Dispatch<React.SetStateAction<boolean>>;
}

const CharacterCreator = ({ roomId, setInRoom }: Props) => {
    const [name, setName] = useState<string>("");

    function finish() {
        const data: JoinRoomData = {
            roomId,
            playerName: name,
        };
        ws.emit(WSM.JoinRoom, data);
        setInRoom(true);
    }

    return (
        <div className="app-container">
            <h2>CharacterCreator</h2>
            <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key == "Enter" && name.trim() && finish()}
            />
            <button onClick={finish} disabled={!name.trim()}>
                Finish
            </button>
        </div>
    );
};

export default CharacterCreator;
