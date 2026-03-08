# 🎬 CineVote

A real-time movie voting web app built with **React + TypeScript (Vite)** and **Node.js + Socket.IO**.
Users can create rooms, invite others via a room code, add movie suggestions, vote, and see results—all in real-time.

---

## 🏗 Features

- Create a room and become the host
- Join a room using a code
- Phase 1: Add movie suggestions
- Phase 2: Vote (single/double upvote/downvote) on each movie
- Phase 3: View voting results
- Real-time updates for all participants
- Host can force phase transitions

---

## 🖥 Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, Socket.IO
- **Realtime:** WebSockets via Socket.IO

---

## Installation

### 1. Clone the repo

```bash
git clone https://github.com/jaron2668/CineVote.git
cd CineVote
```

### 2. Install dependencies

#### Frontend

```bash
cd client
npm install
```

#### Backend

```bash
cd ../server
npm install
```

---

## Running the App

### Backend

```bash
npx tsx index.ts
```

Backend runs on `http://localhost:3001` by default. Change `shared/config.ts` if needed. \
CORS is configured with `*`, allowing requests from any origin by default. Change in `server/src/index.ts` if needed.

---

### Frontend

```bash
cd ../client
npm run dev
```

App runs on `http://localhost:5173` (default Vite port).

---

## Project Structure

```text
TODO update
```

---

## Future Improvements

- Fancier frontend
  (- Use external API for movie suggestions (TMDb, OMDb))
- /roomcode to instantly connect to room
- Ready button for add phase
- Timer for voting phase

- Prevent duplicate votes per player
- Remove players from room after inactivity / delete empty rooms
- Handle reconnects / refresh correctly
- Host migration if host disconnects

---

## License

This project is licensed under the [**MIT License**](LICENSE.txt).

---
