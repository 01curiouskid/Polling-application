// Shared types for the polling system

export type PollStatus = 'active' | 'closed';

export interface PollQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: string; // The correct answer option
  createdAt: number;
  expiresAt: number;
  status: PollStatus;
  results: { [option: string]: number };
  answeredBy?: string[]; // student IDs (serialized for transmission)
  studentAnswers?: { [studentId: string]: string }; // studentId -> selected option
  studentAnswer?: string; // For performance view - the option this student selected
}

export interface Student {
  id: string;
  name: string;
  joinedAt: number;
}

// Socket.io Event Types
export interface ServerToClientEvents {
  'server:question_updated': (question: PollQuestion) => void;
  'server:results_updated': (results: { [option: string]: number }) => void;
  'server:timer_tick': (secondsRemaining: number) => void;
  'server:question_closed': () => void;
  'server:error': (message: string) => void;
  'server:participants_updated': (participants: Array<{ id: string; name: string }>) => void;
  'server:chat_message': (data: { id: string; sender: string; senderId: string; message: string; timestamp: number; isTeacher: boolean }) => void;
}

export interface ClientToServerEvents {
  'teacher:create_question': (
    data: { question: string; options: string[]; correctAnswer?: string; timeLimit?: number },
    callback: (response: { success: boolean; question?: PollQuestion; error?: string }) => void
  ) => void;
  'student:submit_answer': (
    data: { questionId: string; option: string },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;
  'teacher:end_question': (callback: (response: { success: boolean; error?: string }) => void) => void;
  'student:join': (data: { name: string; studentId?: string }, callback: (response: { success: boolean; studentId?: string; error?: string }) => void) => void;
  'teacher:get_participants': (callback: (response: { success: boolean; participants?: Array<{ id: string; name: string }>; error?: string }) => void) => void;
  'teacher:get_history': (callback: (response: { success: boolean; history?: PollQuestion[]; error?: string }) => void) => void;
  'student:get_performance': (callback: (response: { success: boolean; performance?: PollQuestion[]; error?: string }) => void) => void;
  'student:send_message': (data: { message: string }, callback: (response: { success: boolean; error?: string }) => void) => void;
  'teacher:send_message': (data: { message: string }, callback: (response: { success: boolean; error?: string }) => void) => void;
}

