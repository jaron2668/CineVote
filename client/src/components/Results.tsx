import type { Room } from "../../../shared/model/room.js";

interface ResultsProps {
    room: Room;
}

export default function Results({ room }: ResultsProps) {
    const sorted = Object.values(room.movies).sort((a, b) => b.votes - a.votes);

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
        </div>
    );
}
