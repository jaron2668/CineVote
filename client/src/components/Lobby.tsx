import ws from "../socket.js";
import { playerId } from "../socket.js";
import {
    WebSocketMessage as WSM,
    type LeaveRoomData,
    type StartAddPhaseData,
    type KickPlayerData,
} from "../../../shared/ws_types.js";
import type { Player } from "../../../shared/model/player.js";
import type { Room } from "../../../shared/model/room.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface LobbyProps {
    room: Room;
}

export default function Lobby({ room }: LobbyProps) {
    const navigate = useNavigate();
    const [copied, setCopied] = useState<boolean>(false);

    // Handle being kicked from lobby
    useEffect(() => {
        const handleKicked = () => {
            navigate("/");
        };

        ws.on(WSM.PlayerKicked, handleKicked);

        return () => {
            ws.off(WSM.PlayerKicked, handleKicked);
        };
    }, [navigate]);

    function startAddPhase() {
        const data: StartAddPhaseData = {
            roomId: room.id,
        };
        ws.emit(WSM.StartAddPhase, data);
    }

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

    const leave = () => {
        const data: LeaveRoomData = {
            roomId: room.id,
        };
        ws.emit(WSM.LeaveRoom, data);
        navigate("/");
    };

    const kickPlayer = (targetPlayerId: string) => {
        const data: KickPlayerData = {
            roomId: room.id,
            playerId: targetPlayerId,
        };
        ws.emit(WSM.KickPlayer, data);
    };

    return (
        <div className="app-container">
            <div>
                <h2>Room: {room.id}</h2>
                <button onClick={copyLink}>
                    {copied ? "Copied!" : "Copy Room Link"}
                </button>
                <button className="leave-btn" onClick={leave}>
                    Leave Room
                </button>
            </div>
            <ul className="player-list">
                {room.players.map((p: Player) => (
                    <li key={p.id}>
                        <span>{p.name}</span>
                        {playerId === room.hostId && p.id !== playerId && (
                            <button
                                onClick={() => kickPlayer(p.id)}
                                className="kick-btn"
                                title="Kick player"
                            >
                                ✕
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {playerId === room.hostId && (
                <button onClick={startAddPhase}>Start Adding Movies</button>
            )}
        </div>
    );
}
