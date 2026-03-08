import ws from "../socket.js";
import { playerId } from "../socket.js";
import {
    WebSocketMessage as WSM,
    type StartAddPhaseData,
} from "../../../shared/ws_types.js";
import type { Player } from "../../../shared/model/player.js";
import type { Room } from "../../../shared/model/room.js";

interface LobbyProps {
    room: Room;
}

export default function Lobby({ room }: LobbyProps) {
    function startAddPhase() {
        const data: StartAddPhaseData = {
            roomId: room.id,
        };
        ws.emit(WSM.StartAddPhase, data);
    }

    return (
        <div className="app-container">
            <h2>Room: {room.id}</h2>

            <ul className="player-list">
                {room.players.map((p: Player) => (
                    <li key={p.id}>{p.name}</li>
                ))}
            </ul>

            {playerId === room.hostId && (
                <button onClick={startAddPhase}>Start Adding Movies</button>
            )}
        </div>
    );
}
