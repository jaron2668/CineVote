import ws from "../socket.js";
import { playerId } from "../socket.js";
import {
    WebSocketMessage as WSM,
    type StartAddPhaseData,
} from "../../../shared/ws_types.js";
import type { Player } from "../../../shared/model/player.js";
import type { Room } from "../../../shared/model/room.js";
import { useState } from "react";

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

    const [copied, setCopied] = useState<boolean>(false);

    const copyLink = async () => {
        const link = `${window.location.origin}/room/${room.id}`;
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2s
        } catch (err) {
            console.error("Failed to copy!", err);
        }
    };

    return (
        <div className="app-container">
            <div>
                <h2>Room: {room.id}</h2>
                <button onClick={copyLink}>
                    {copied ? "Copied!" : "Copy Room Link"}
                </button>
            </div>
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
