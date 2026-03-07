import { useState } from "react";
import ws, { playerId } from "../socket.js";
import {
    WebSocketMessage as WSM,
    type ForceFinishVotingData,
    type PlayerFinishedVotingData,
    type PlayerVoteData,
} from "../../../shared/ws_types.js";
import type { Room } from "../../../shared/model/room.js";

interface VotingProps {
    room: Room;
}

export default function Voting({ room }: VotingProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [finished, setFinished] = useState(false);

    const movies = Object.values(room.movies);
    const movie = movies[currentIndex];

    function handleVote(vote: 2 | 1 | -1 | -2) {
        const data: PlayerVoteData = {
            roomId: room.id,
            movieId: movie.id,
            vote,
        };
        ws.emit(WSM.PlayerVote, data);

        const nextIndex = currentIndex + 1;

        if (nextIndex >= movies.length) {
            setFinished(true);

            const data: PlayerFinishedVotingData = {
                roomId: room.id,
            };
            ws.emit(WSM.PlayerFinishedVoting, data);
        } else {
            setCurrentIndex(nextIndex);
        }
    }

    function forceEndVoting() {
        const data: ForceFinishVotingData = {
            roomId: room.id,
        };
        ws.emit(WSM.ForceFinishVoting, data);
    }

    if (finished) {
        return (
            <div className="app-container">
                <div className="waiting">
                    Voting finished. Waiting for other players...
                </div>
                {playerId === room.host.id && (
                    <div>
                        <button onClick={forceEndVoting}>
                            Force End of Voting
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="app-container">
            <h2>{movie.title}</h2>

            <div className="voting-buttons">
                <button onClick={() => handleVote(2)}>👍👍</button>
                <button onClick={() => handleVote(1)}>👍</button>
                <button onClick={() => handleVote(-1)}>👎</button>
                <button onClick={() => handleVote(-2)}>👎👎</button>
            </div>

            <p>
                Movie {currentIndex + 1} / {movies.length}
            </p>
        </div>
    );
}
