import ws from "../socket.js";
import {
    WebSocketMessage as WSM,
    type LeaveRoomData,
    type StartAddPhaseData,
    type KickPlayerData,
} from "../../../shared/ws_types.js";
import type { Room } from "../../../shared/model/room.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";

interface LobbyProps {
    room: Room;
}

export default function Lobby({ room }: LobbyProps) {
    const navigate = useNavigate();
    const [copied, setCopied] = useState<boolean>(false);
    const [showKickedPopup, setShowKickedPopup] = useState<boolean>(false);

    // Handle being kicked from lobby
    useEffect(() => {
        const handleKicked = () => {
            setShowKickedPopup(true);
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

    const kickPlayer = (targetPlayerIndex: number) => {
        const data: KickPlayerData = {
            roomId: room.id,
            playerIndex: targetPlayerIndex,
        };
        ws.emit(WSM.KickPlayer, data);
    };

    const acceptKick = () => {
        navigate("/");
    };

    return (
        <div className="app-container">
            <Modal open={showKickedPopup} onClose={acceptKick}>
                <Box className="modal-box">
                    <h2 className="modal-title">
                        You got kicked from this lobby
                    </h2>
                    <button onClick={acceptKick}>Back to home</button>
                </Box>
            </Modal>

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
                {room.players.map((p: string, index: number) => (
                    <li>
                        <span>{p}</span>
                        {/*p.id !== playerId replaced with index !== 0    not sure if this will work*/}
                        {room.host && index !== 0 && (
                            <button
                                onClick={() => kickPlayer(index)}
                                className="kick-btn"
                                title="Kick player"
                            >
                                ✕
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {room.host && (
                <button onClick={startAddPhase}>Start Adding Movies</button>
            )}
        </div>
    );
}
