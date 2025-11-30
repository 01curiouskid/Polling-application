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
  answeredBy: Set<string>;
  studentAnswers?: Map<string, string>; // studentId -> selected option
}

// Serialized version for transmission
export interface PollQuestionSerialized {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: string;
  createdAt: number;
  expiresAt: number;
  status: PollStatus;
  results: { [option: string]: number };
  answeredBy: string[];
  studentAnswers?: { [studentId: string]: string }; // studentId -> selected option
}

export interface Student {
  id: string;
  name: string;
  joinedAt: number;
}

