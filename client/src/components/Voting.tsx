import { useEffect, useState } from "react";
import ws from "../socket.js";
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

    if (finished) {
        return (
            <div className="app-container">
                <div>Remaining Time: {formatTime(remainingTime)}</div>
                <div className="waiting">
                    Voting finished. Waiting for other players...
                </div>
                {room.host && (
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
            <div>Remaining Time: {formatTime(remainingTime)}</div>
            <h2>{movie.title}</h2>

            <div className="voting-buttons">
                <button onClick={() => handleVote(2)}>
                    {"\u{1F44D}\u{1F44D}"}
                </button>
                <button onClick={() => handleVote(1)}>{"\u{1F44D}"}</button>
                <button onClick={() => handleVote(-1)}>{"\u{1F44E}"}</button>
                <button onClick={() => handleVote(-2)}>
                    {"\u{1F44E}\u{1F44E}"}
                </button>
            </div>

            <p>
                Movie {currentIndex + 1} / {movies.length}
            </p>
        </div>
    );
}
