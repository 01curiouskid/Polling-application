# Hosted Here: https://polling-application-six.vercel.app/
# Live Polling System

A real-time polling system built with React (TypeScript) frontend and Express.js + Socket.io backend.

## Architecture Overview

### Frontend (`frontend/`)
- **React 18** with **TypeScript**
- **Socket.io Client** for real-time communication
- **React Router** for navigation
- Component-based architecture following Figma design
- State management with React Context/Hooks

### Backend (`backend/`)
- **Express.js** server
- **Socket.io** for real-time bidirectional communication
- In-memory store for active polls (can be extended with DB)
- Single global room/session for polling

### Data Model

**Poll Question:**
```typescript
{
  id: string;
  question: string;
  options: string[];
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'closed';
  results: { [option: string]: number };
  answeredBy: Set<string>; // student IDs who answered
}
```

**Student:**
```typescript
{
  id: string;
  name: string;
  joinedAt: number;
}
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- (Optional) PostgreSQL/MongoDB for bonus features

### Quick Start (Run Both Servers)

You need to run **both** the backend and frontend servers. Open **two separate terminal windows/tabs**:

#### Terminal 1 - Backend Server
```bash
cd backend
npm install  # (if you haven't already)
npm run dev
```

You should see:
```
🚀 Server running on port 3001
📡 Socket.io server ready
```

Backend runs on `http://localhost:3001`

#### Terminal 2 - Frontend Server
```bash
cd frontend
npm install  # (if you haven't already)
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

Frontend runs on `http://localhost:5173`

### Access the App

1. Open your browser and go to: **http://localhost:5173**
2. You'll see the home page with two buttons:
   - **Teacher View** - Click to go to `/teacher`
   - **Student View** - Click to go to `/student`

### Testing the App

1. Open **Teacher View** in one browser tab
2. Open **Student View** in another browser tab (or different browser)
3. In Student View, enter your name and click "Join Poll"
4. In Teacher View, create a new poll question
5. Watch the real-time updates as students answer!

### Environment Variables

**Frontend** (`.env` or `.env.local`):
```
VITE_BACKEND_URL=http://localhost:3001
```

**Backend** (`.env`):
```
PORT=3001
NODE_ENV=development
# Optional for bonus features:
# DATABASE_URL=postgresql://...
```

### Running Together

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173` in browser

## Project Structure

```
interveu/
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components (Teacher, Student)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── socket/          # Socket.io client setup
│   │   ├── types/           # TypeScript type definitions
│   │   ├── styles/          # Global styles, theme
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── routes/          # Express routes
│   │   ├── socket/           # Socket.io event handlers
│   │   ├── models/           # Data models (if using DB)
│   │   ├── utils/            # Helper functions
│   │   └── server.ts         # Main server file
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## Features

### Teacher
- Create new poll questions
- View live results as students answer
- Configure time limit per question (default: 60s)
- View past poll results (bonus)

### Student
- Enter name on first visit
- Answer poll questions (once per question)
- View live results after answering
- Auto-lock after 60 seconds

## Socket.io Events

### Client → Server
- `teacher:create_question` - Teacher creates a new question
- `student:submit_answer` - Student submits an answer
- `teacher:end_question` - Teacher manually ends polling
- `student:join` - Student joins with name

### Server → Client
- `server:question_updated` - New question broadcasted
- `server:results_updated` - Poll results updated
- `server:timer_tick` - Countdown updates
- `server:question_closed` - Question closed (timeout/all answered)

## Deployment

### Frontend (Vercel/Netlify)
1. Set `VITE_BACKEND_URL` to your backend URL
2. Deploy using Vercel CLI or connect GitHub repo

### Backend (Render/Railway)
1. Set environment variables
2. Deploy using platform's CLI or connect GitHub repo
3. Ensure WebSocket support is enabled

## Development Notes

- Backend is the source of truth for timer and poll state
- Frontend shows countdown but backend enforces time limits
- One active question at a time
- Students are identified by unique ID per browser tab

