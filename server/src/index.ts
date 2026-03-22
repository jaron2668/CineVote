import http from "http";
import { Server } from "socket.io";

import { backendPort } from "../../shared/config.js";
import { setupWebSocketHandlers } from "./websocketHandlers.js";

const httpServer = http.createServer();

const wss = new Server(httpServer, {
    /** Allow connections from any origin (TODO: set origin to specific URL in production) */
    cors: { origin: "*" },
});

/**
 * Authentication middleware for Socket.IO connections.
 * Validates that each connecting client provides a stable playerId in handshake.auth.
 * The playerId is used to track players across socket reconnections.
 * @throws Error if playerId is missing from handshake.auth
 */
wss.use((ws, next) => {
    const { playerId } = ws.handshake.auth;
    if (!playerId) return next(new Error("Missing playerId"));

    // store playerId in socket data for access in event handlers
    ws.data.playerId = playerId;
    next();
});

setupWebSocketHandlers(wss);

httpServer.listen(backendPort, () => {
    console.log("server running");
});
