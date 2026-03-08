import type { Room } from "../../../shared/model/room.js";
import { playerId } from "../socket.js";

interface ResultsProps {
    room: Room;
}

export default function Results({ room }: ResultsProps) {
    const sorted = Object.values(room.movies).sort((a, b) => b.votes - a.votes);

    function reset() {}

    return (
        <div className="app-container">
            <h2>Results</h2>

            <ul className="results-list">
                {sorted.map((m) => (
                    <li key={m.id}>
                        <span>{m.title}</span>
                        <span>{m.votes} votes</span>
                    </li>
                ))}
            </ul>
            {playerId === room.hostId && (
                <div>
                    <button onClick={reset}>Back to lobby</button>
                </div>
            )}
        </div>
    );
}
