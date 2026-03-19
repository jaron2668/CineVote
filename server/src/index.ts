import http from "http";
import { Server } from "socket.io";

import { backendPort } from "../../shared/config.js";
import { setupWebSocketHandlers } from "./websocketHandlers.js";

const httpServer = http.createServer();

const wss = new Server(httpServer, {
    cors: { origin: "*" },
});

wss.use((ws, next) => {
    const { playerId } = ws.handshake.auth;
    if (!playerId) return next(new Error("Missing playerId"));

    ws.data.playerId = playerId;
    next();
});

setupWebSocketHandlers(wss);

httpServer.listen(backendPort, () => {
    console.log("server running");
});
