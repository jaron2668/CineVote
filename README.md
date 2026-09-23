# 🎬 CineVote

A real-time collaborative movie voting application. Players create rooms, invite friends via room code, suggest movies, vote with a scale of -2 to +2, and watch results update in real-time.

Perfect for groups deciding what to watch together.

---

## Features

- **Real-Time Collaboration** — All players see updates instantly via WebSockets
- **Four-Phase Workflow:**
    - 🏠 **Lobby** — Players join and prepare
    - 🎬 **Add Phase** — Everyone suggests movies
    - ⭐ **Vote Phase** — Vote on each movie (-2 to +2 scale)
    - 🏆 **Results** — See ranked movies by total votes
- **Room Management** — Create rooms, join with codes, invite friends
- **Host Controls** — Force phase transitions and kick players
- **Persistent Identity** — Reconnect to rooms even after a connection loss
- **Responsive UI** — Works on desktop and mobile

---

## 🎮 How to Play

1. **Create or Join**
    - Click "Create Room" to become the host
    - Or join an existing room with a room code

2. **Wait for Players**
    - Invite friends to join your room
    - Minimum 2 player required to start

3. **Add Movies**
    - Host clicks "Start Adding Movies"
    - All players suggest movies during the add phase

4. **Vote**
    - Host clicks "Start Voting" or the timer runs out
    - Vote on each movie: `+2` (love), `+1` (like), `0` (neutral), `-1` (dislike), `-2` (hate)

5. **See Results**
    - Movies ranked by total vote count
    - Host can restart for another round

---

## 🖥 Tech Stack

**Frontend:**

- React 19 + TypeScript
- Vite (build tool)
- Socket.IO client (real-time communication)

**Backend:**

- Node.js
- Socket.IO server (real-time bidirectional communication)
- In-memory state management

**Shared:**

- TypeScript types and interfaces for communication
- Configuration

---

## Getting Started

### Prerequisites

- Node.js 25
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/jaron2668/CineVote.git
cd CineVote
```

```bash
# Install dependencies
cd client
npm install
cd ../server
npm install
```

---

### Running the App

#### Backend

```bash
cd server
npx tsx src/index.ts
```

Backend runs on `http://localhost:3001` by default. Change `shared/config.ts` if needed. \
CORS is configured with `*`, allowing requests from any origin by default. Change in `server/src/index.ts` if needed.

---

#### Frontend

```bash
cd client
npm run dev
```

App runs on `http://localhost:5173` (default Vite port).

---

## ⚙️ Configuration

### Backend Port

Edit `shared/config.ts`:

```typescript
export const backendPort = 3006; // Change port here
```

### CORS

Edit `server/src/index.ts`:

```typescript
cors: {
    origin: "*";
} // Change to specific domain in production
```

---

## Project Structure

```
CineVote/
├── client/                          # React + Vite frontend
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── Voting.tsx          # Voting phase UI
│   │   │   ├── Lobby.tsx           # Lobby phase UI
│   │   │   ├── AddMovies.tsx       # Movie suggestion UI
│   │   │   ├── Results.tsx         # Results display
│   │   │   ├── JoinOrCreate.tsx    # Room creation/joining
│   │   │   ├── CharacterCreator.tsx # Player setup
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Landing page
│   │   │   └── Room.tsx            # Main game room
│   │   ├── App.tsx                 # Root component
│   │   ├── main.tsx                # Vite entry point
│   │   ├── socket.ts               # Socket.IO setup and events
│   │   └── ...
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                          # Node.js + Socket.IO backend
│   ├── src/
│   │   ├── index.ts                # Server entry point, Socket.IO setup
│   │   ├── websocketHandlers.ts    # All WebSocket event handlers (create, join, vote, etc.)
│   │   ├── roomManager.ts          # Room CRUD operations and phase transitions
│   │   ├── serverRoom.ts           # ServerRoom class (server-side room state)
│   │   ├── serverMovie.ts          # ServerMovie class (vote tracking)
│   │   └── utils.ts                # Utility functions
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                          # Shared types and configuration
│   ├── model/
│   │   ├── room.ts                 # Room interface
│   │   ├── player.ts               # Player interface
│   │   └── movie.ts                # Movie interface
│   ├── config.ts                   # Backend port, shared constants
│   ├── ws_types.ts                 # WebSocket event types
│   └── package.json
│
├── README.md                        # This file
└── LICENSE.txt
```

---

## Future Improvements

- Fancier frontend
- (Use external API for movie suggestions)
- Option for ready button in add phase instead of fixed timer
- (Avatar creator)

- Remove players from room after inactivity
- Host migration if host disconnects

---

## License

This project is licensed under the [**MIT License**](LICENSE.txt).

---

## Questions?

Open an issue on GitHub or reach out to me.
