import { useEffect, useState } from "react";
import ws from "../socket.js";
import {
    WebSocketMessage as WSM,
    type AddMovieData,
    type StartVotingData,
} from "../../../shared/ws_types.js";
import type { Room } from "../../../shared/model/room.js";

interface AddMoviesProps {
    room: Room;
}

export default function AddMovies({ room }: AddMoviesProps) {
    const [movie, setMovie] = useState<string>("");
    const [movies, setMovies] = useState<string[]>([]);

    function addMovie() {
        if (!movie.trim()) return;
        const data: AddMovieData = {
            roomId: room.id,
            title: movie.trim(),
        };
        setMovies([...movies, data.title]);
        ws.emit(WSM.AddMovie, data);
        setMovie("");
    }

    function startVoting() {
        const data: StartVotingData = {
            roomId: room.id,
        };
        ws.emit(WSM.StartVoting, data);
    }

    const [remainingTime, setRemainingTime] = useState(-1);

    useEffect(() => {
        const interval = setInterval(() => {
            const rem = room.phaseEndTime - Date.now();
            setRemainingTime(rem);
        }, 500); // refresh every 500 ms

        return () => clearInterval(interval);
    }, [room.phaseEndTime]);

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        //const milliseconds = Math.floor((ms % 1000) / 100);

        //return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds}`;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className="app-container">
            <div>Remaining Time: {formatTime(remainingTime)}</div>
            <h2>Add Movies</h2>

            <input
                value={movie}
                onChange={(e) => setMovie(e.target.value)}
                placeholder="Enter movie title"
                onKeyDown={(e) => e.key === "Enter" && addMovie()}
            />

            <button onClick={addMovie} disabled={!movie.trim()}>
                Add Movie
            </button>

            <ul className="movie-list">
                {movies.map((title: string, index: number) => (
                    <li key={index}>{title}</li>
                ))}
            </ul>

            {room.host &&
                movies.length > 0 && ( // TODO: maybe use room.movies instead but it is currently only synced after add phase is finished
                    <button onClick={startVoting}>Start Voting</button>
                )}
        </div>
    );
}
