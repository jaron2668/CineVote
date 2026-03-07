import { io } from "socket.io-client";
import { backendAdr } from "../../shared/config.js";

export const playerId: string = crypto.randomUUID();

const socket = io(backendAdr, {
    auth: { playerId },
});

export default socket;
