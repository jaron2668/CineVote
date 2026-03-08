import { io } from "socket.io-client";
import { backendAdr } from "../../shared/config.js";

const storedId: string | null = localStorage.getItem("playerId");

export const playerId: string = storedId ?? crypto.randomUUID();

if (!storedId) {
    localStorage.setItem("playerId", playerId);
}

const socket = io(backendAdr, {
    auth: { playerId },
});

export default socket;
