import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './socket/handlers.js';
import { PollQuestion, Student } from './types/index.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// In-memory store
let activeQuestion: PollQuestion | null = null;
const students = new Map<string, Student>();
const pollHistory: PollQuestion[] = []; // Store completed polls
const currentSessionQuestions: PollQuestion[] = []; // Track questions in current session

// Helper function to generate unique IDs
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to create a poll question
const createPollQuestion = (
  question: string,
  options: string[],
  timeLimit: number = 60,
  correctAnswer?: string
): PollQuestion => {
  const now = Date.now();
  return {
    id: generateId(),
    question,
    options,
    correctAnswer,
    createdAt: now,
    expiresAt: now + timeLimit * 1000,
    status: 'active',
    results: options.reduce((acc, opt) => ({ ...acc, [opt]: 0 }), {}),
    answeredBy: new Set<string>(),
    studentAnswers: new Map<string, string>(),
  };
};

// Setup socket handlers with shared state
const store = {
  get activeQuestion() { return activeQuestion; },
  set activeQuestion(value) { activeQuestion = value; },
  students,
  createPollQuestion,
  generateId,
  io,
  pollHistory,
  currentSessionQuestions,
};

setupSocketHandlers(io, store);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
});

