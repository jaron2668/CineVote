export enum WebSocketMessage {
    CreateRoom = "createRoom",
    JoinRoom = "joinRoom",
    RoomUpdate = "roomUpdate",
    StartAddPhase = "startAddPhase",
    AddMovie = "addMovie",
    StartVoting = "startVoting",
    PlayerVote = "playerVote",
    PlayerFinishedVoting = "playerFinishedVoting",
    ForceFinishVoting = "forceFinishVoting",
}

export type CreateRoomData = {
    playerName: string;
};
export type CreateRoomCallback = (roomCode: string) => void;

export type JoinRoomData = {
    roomId: string;
    playerName: string;
};

export type StartAddPhaseData = {
    roomId: string;
};

export type AddMovieData = {
    roomId: string;
    title: string;
};

export type StartVotingData = {
    roomId: string;
};

export type PlayerVoteData = {
    roomId: string;
    movieId: string;
    vote: 2 | 1 | -1 | -2;
};

export type PlayerFinishedVotingData = {
    roomId: string;
};
export type ForceFinishVotingData = {
    roomId: string;
};
