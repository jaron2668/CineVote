import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

import { backendPort } from "../../shared/config.js";
import { setupWebSocketHandlers } from "./websocketHandlers.js";

const app = express();
app.use(cors());

const httpServer = http.createServer(app);

const wss = new Server(httpServer, {
    cors: { origin: "*" },
});

wss.use((ws, next) => {
    const { playerId } = ws.handshake.auth;
    if (!playerId) return next(new Error("Missing playerId"));

    ws.data.playerId = playerId; // save stable id
    next();
});

setupWebSocketHandlers(wss);

// start server
httpServer.listen(backendPort, () => {
    console.log("server running");
});
