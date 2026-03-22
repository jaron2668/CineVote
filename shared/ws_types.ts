/**
 * WebSocket message types used in CineVote communication
 * These are the event names for all client-server communications.
 */
export const WebSocketMessage = {
    CreateRoom: "createRoom",
    GetRoomStatus: "getRoomStatus",
    GetPlayerInRoomStatus: "getPlayerInRoomStatus",
    JoinRoom: "joinRoom",
    LeaveRoom: "leaveRoom",
    RejoinRoom: "rejoinRoom",
    RoomUpdate: "roomUpdate",
    StartAddPhase: "startAddPhase",
    AddMovie: "addMovie",
    StartVoting: "startVoting",
    PlayerVote: "playerVote",
    PlayerFinishedVoting: "playerFinishedVoting",
    ForceFinishVoting: "forceFinishVoting",
    BackToLobbyState: "backToLobbyState",
    KickPlayer: "kickPlayer",
    PlayerKicked: "playerKicked",
} as const;

// Type for TypeScript
export type WebSocketMessage =
    (typeof WebSocketMessage)[keyof typeof WebSocketMessage];

export type CreateRoomData = {
    //playerId: string;
};
export type CreateRoomCallback = (roomCode: string) => void;

export type JoinRoomData = {
    roomId: string;
    playerName: string;
};

export type LeaveRoomData = {
    roomId: string;
};

export type RejoinRoomData = {
    roomId: string;
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

export type GetRoomStatusData = {
    roomId: string;
};
export type GetRoomStatusCallback = (
    result: "non-existent" | "lobby" | "ingame",
) => void;

export type GetPlayerInRoomStatusData = {
    roomId: string;
    playerId: string;
};
export type GetPlayerInRoomStatusCallback = (
    result: "joined" | "not-joined" | "invalid-room",
) => void;

export type BackToLobbyStateData = {
    roomId: string;
};

export type KickPlayerData = {
    roomId: string;
    playerIndex: number;
};
