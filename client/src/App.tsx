import { useEffect, useState } from "react";
import ws from "./socket.js";
import { WebSocketMessage as WSM } from "../../shared/ws_types.js";
import type { Room } from "../../shared/model/room.js";
import JoinOrCreate from "./components/JoinOrCreate.js";
import Lobby from "./components/Lobby.js";
import AddMovies from "./components/AddMovies.js";
import Voting from "./components/Voting.js";
import Results from "./components/Results.js";
import "./App.css";

function App() {
    const [room, setRoom] = useState<Room | null>(null);

    useEffect(() => {
        ws.on(WSM.RoomUpdate, (room) => {
            setRoom(room);
        });
    }, []);

    if (!room) {
        return <JoinOrCreate />;
    }

    if (room.phase === "lobby") {
        return <Lobby room={room} />;
    }

    if (room.phase === "add") {
        return <AddMovies room={room} />;
    }

    if (room.phase === "vote") {
        return <Voting room={room} />;
    }

    if (room.phase === "results") {
        return <Results room={room} />;
    }

    return (
        <div className="app-container">
            <div>Unknown phase</div>
        </div>
    );
}

export default App;
