import { Server, Socket } from 'socket.io';
import { PollQuestion, PollQuestionSerialized, Student } from '../types/index.js';

const serializeQuestion = (question: PollQuestion): PollQuestionSerialized => ({
  ...question,
  answeredBy: Array.from(question.answeredBy),
  studentAnswers: question.studentAnswers ? Object.fromEntries(question.studentAnswers) : undefined,
});

interface Store {
  get activeQuestion(): PollQuestion | null;
  set activeQuestion(value: PollQuestion | null): void;
  students: Map<string, Student>;
  createPollQuestion: (question: string, options: string[], timeLimit?: number, correctAnswer?: string) => PollQuestion;
  generateId: () => string;
  io: Server;
  pollHistory: PollQuestion[];
}

export const setupSocketHandlers = (io: Server, store: Store) => {
  const { students, createPollQuestion, generateId } = store;
  let questionTimer: NodeJS.Timeout | null = null;
  let timerInterval: NodeJS.Timeout | null = null;

  const startTimer = (question: PollQuestion) => {
    const updateTimer = () => {
      const currentQuestion = store.activeQuestion;
      if (!currentQuestion || currentQuestion.id !== question.id) {
        // Question changed, stop timer
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        return;
      }

      const now = Date.now();
      const secondsRemaining = Math.max(0, Math.ceil((question.expiresAt - now) / 1000));

      io.emit('server:timer_tick', secondsRemaining);

      if (secondsRemaining === 0) {
        closeQuestion();
      }
    };

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
  };

  const closeQuestion = () => {
    const activeQuestion = store.activeQuestion;
    if (activeQuestion) {
      activeQuestion.status = 'closed';
      
      // Save to history before clearing - create a deep copy
      const historyEntry: PollQuestion = {
        ...activeQuestion,
        answeredBy: new Set(activeQuestion.answeredBy), // Clone the Set
        studentAnswers: activeQuestion.studentAnswers ? new Map(activeQuestion.studentAnswers) : new Map(),
      };
      store.pollHistory.push(historyEntry);
      
      store.activeQuestion = null;
      io.emit('server:question_closed');
      
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      if (questionTimer) {
        clearTimeout(questionTimer);
        questionTimer = null;
      }
    }
  };

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Send current question if one exists (for any client that connects)
    // Socket.io will queue the message if handlers aren't ready yet
    const currentQuestion = store.activeQuestion;
    if (currentQuestion && currentQuestion.status === 'active') {
      // Use a small delay to ensure frontend handlers are set up
      setTimeout(() => {
        socket.emit('server:question_updated', serializeQuestion(currentQuestion));
        const now = Date.now();
        const secondsRemaining = Math.max(0, Math.ceil((currentQuestion.expiresAt - now) / 1000));
        socket.emit('server:timer_tick', secondsRemaining);
      }, 100);
    }

    // Student joins
    socket.on('student:join', (data: { name: string; studentId?: string }, callback) => {
      try {
        let studentId = data.studentId;
        
        // If studentId provided, check if it exists (reconnection)
        if (studentId && students.has(studentId)) {
          // Reconnecting with existing ID
          const student = students.get(studentId)!;
          socket.data.studentId = studentId;
          socket.data.role = 'student';
          
          // Send current question if exists
          const currentQuestion = store.activeQuestion;
          if (currentQuestion && currentQuestion.status === 'active') {
            socket.emit('server:question_updated', serializeQuestion(currentQuestion));
            const now = Date.now();
            const secondsRemaining = Math.max(0, Math.ceil((currentQuestion.expiresAt - now) / 1000));
            socket.emit('server:timer_tick', secondsRemaining);
          }
          
          callback({ success: true, studentId });
          console.log(`Student reconnected: ${student.name} (${studentId})`);
          return;
        }
        
        // New student join
        studentId = generateId();
        const student: Student = {
          id: studentId,
          name: data.name,
          joinedAt: Date.now(),
        };
        students.set(studentId, student);
        socket.data.studentId = studentId;
        socket.data.role = 'student';

        // Send current question if exists
        const currentQuestion = store.activeQuestion;
        if (currentQuestion && currentQuestion.status === 'active') {
          socket.emit('server:question_updated', serializeQuestion(currentQuestion));
          const now = Date.now();
          const secondsRemaining = Math.max(0, Math.ceil((currentQuestion.expiresAt - now) / 1000));
          socket.emit('server:timer_tick', secondsRemaining);
        }

        // Broadcast updated participants list
        const participants = Array.from(students.values()).map(s => ({ id: s.id, name: s.name }));
        store.io.emit('server:participants_updated', participants);

        callback({ success: true, studentId });
        console.log(`Student joined: ${student.name} (${studentId})`);
      } catch (error) {
        callback({ success: false, error: 'Failed to join' });
      }
    });

    // Teacher creates question
    socket.on('teacher:create_question', (data: { question: string; options: string[]; correctAnswer?: string; timeLimit?: number }, callback) => {
      try {
        // Check if there's an active question
        const currentQuestion = store.activeQuestion;
        if (currentQuestion && currentQuestion.status === 'active') {
          callback({ success: false, error: 'A question is already active. Please end it first.' });
          return;
        }

        const timeLimit = data.timeLimit || 60;
        const newQuestion = createPollQuestion(data.question, data.options, timeLimit, data.correctAnswer);
        store.activeQuestion = newQuestion;

        // Broadcast to all clients
        io.emit('server:question_updated', serializeQuestion(newQuestion));
        startTimer(newQuestion);

        // Set timeout to close question
        questionTimer = setTimeout(() => {
          closeQuestion();
        }, timeLimit * 1000);

        callback({ success: true, question: serializeQuestion(newQuestion) });
        console.log(`Teacher created question: ${newQuestion.question}`);
      } catch (error) {
        callback({ success: false, error: 'Failed to create question' });
      }
    });

    // Student submits answer
    socket.on('student:submit_answer', (data: { questionId: string; option: string }, callback) => {
      try {
        const studentId = socket.data.studentId;

        if (!studentId) {
          callback({ success: false, error: 'You must join first' });
          return;
        }

        const activeQuestion = store.activeQuestion;
        if (!activeQuestion || activeQuestion.status !== 'active') {
          callback({ success: false, error: 'No active question' });
          return;
        }

        if (activeQuestion.id !== data.questionId) {
          callback({ success: false, error: 'Question ID mismatch' });
          return;
        }

        if (activeQuestion.answeredBy.has(studentId)) {
          callback({ success: false, error: 'You have already answered this question' });
          return;
        }

        if (!activeQuestion.options.includes(data.option)) {
          callback({ success: false, error: 'Invalid option' });
          return;
        }

        // Record answer
        activeQuestion.answeredBy.add(studentId);
        activeQuestion.results[data.option] = (activeQuestion.results[data.option] || 0) + 1;
        // Store individual student answer
        if (!activeQuestion.studentAnswers) {
          activeQuestion.studentAnswers = new Map<string, string>();
        }
        activeQuestion.studentAnswers.set(studentId, data.option);
        store.activeQuestion = activeQuestion; // Update store

        // Broadcast updated results
        io.emit('server:results_updated', activeQuestion.results);

        // Don't close question automatically - only close on timer or manual end
        // Removed: if (activeQuestion.answeredBy.size >= students.size) { closeQuestion(); }

        callback({ success: true });
        console.log(`Student ${studentId} answered: ${data.option}`);
      } catch (error) {
        callback({ success: false, error: 'Failed to submit answer' });
      }
    });

    // Teacher ends question
    socket.on('teacher:end_question', (callback) => {
      try {
        const activeQuestion = store.activeQuestion;
        if (activeQuestion && activeQuestion.status === 'active') {
          closeQuestion();
          callback({ success: true });
          console.log('Teacher ended question');
        } else {
          callback({ success: false, error: 'No active question' });
        }
      } catch (error) {
        callback({ success: false, error: 'Failed to end question' });
      }
    });

    // Teacher gets participants
    socket.on('teacher:get_participants', (callback) => {
      try {
        const participants = Array.from(students.values()).map(s => ({ id: s.id, name: s.name }));
        callback({ success: true, participants });
      } catch (error) {
        callback({ success: false, error: 'Failed to get participants' });
      }
    });

    // Teacher gets poll history
    socket.on('teacher:get_history', (callback) => {
      try {
        const history = store.pollHistory.map(q => serializeQuestion(q));
        callback({ success: true, history });
      } catch (error) {
        callback({ success: false, error: 'Failed to get poll history' });
      }
    });

    // Student gets their past performance
    socket.on('student:get_performance', (callback) => {
      try {
        const studentId = socket.data.studentId;
        if (!studentId) {
          callback({ success: false, error: 'You must join first' });
          return;
        }

        // Get all polls where this student answered
        const performance = store.pollHistory
          .filter(q => q.answeredBy.has(studentId))
          .map(q => {
            const serialized = serializeQuestion(q);
            // Add the student's selected answer
            const studentAnswer = q.studentAnswers?.get(studentId);
            return {
              ...serialized,
              studentAnswer, // The option this student selected
            };
          });

        callback({ success: true, performance });
      } catch (error) {
        callback({ success: false, error: 'Failed to get performance' });
      }
    });

    // Student sends chat message
    socket.on('student:send_message', (data: { message: string }, callback) => {
      try {
        const studentId = socket.data.studentId;
        if (!studentId) {
          callback({ success: false, error: 'You must join first' });
          return;
        }

        const student = students.get(studentId);
        if (!student) {
          callback({ success: false, error: 'Student not found' });
          return;
        }

        const message = {
          id: generateId(),
          sender: student.name,
          senderId: studentId,
          message: data.message,
          timestamp: Date.now(),
          isTeacher: false,
        };

        // Broadcast to all clients
        io.emit('server:chat_message', message);
        callback({ success: true });
      } catch (error) {
        callback({ success: false, error: 'Failed to send message' });
      }
    });

    // Teacher sends chat message
    socket.on('teacher:send_message', (data: { message: string }, callback) => {
      try {
        const message = {
          id: generateId(),
          sender: 'Teacher',
          senderId: 'teacher',
          message: data.message,
          timestamp: Date.now(),
          isTeacher: true,
        };

        // Broadcast to all clients
        io.emit('server:chat_message', message);
        callback({ success: true });
      } catch (error) {
        callback({ success: false, error: 'Failed to send message' });
      }
    });

    // Teacher kicks a participant
    socket.on('teacher:kick_participant', (data: { participantId: string }, callback) => {
      try {
        const studentId = data.participantId;
        
        // Check if student exists
        if (!students.has(studentId)) {
          callback({ success: false, error: 'Participant not found' });
          return;
        }

        // Find and disconnect the student's socket
        const studentSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.data.studentId === studentId);

        if (studentSocket) {
          // Notify the student they've been kicked
          studentSocket.emit('server:kicked', { 
            reason: 'You have been removed by the teacher' 
          });
          
          // Disconnect the student
          studentSocket.disconnect(true);
        }

        // Remove from participants list
        students.delete(studentId);
        
        // Update participants list for all clients
        const participants = Array.from(students.values()).map(s => ({ 
          id: s.id, 
          name: s.name 
        }));
        io.emit('server:participants_updated', participants);

        callback({ success: true });
        console.log(`Teacher kicked participant: ${studentId}`);
      } catch (error) {
        console.error('Error kicking participant:', error);
        callback({ success: false, error: 'Failed to kick participant' });
      }
    });

    socket.on('disconnect', () => {
      const studentId = socket.data.studentId;
      if (studentId) {
        students.delete(studentId);
        // Broadcast updated participants list
        const participants = Array.from(students.values()).map(s => ({ id: s.id, name: s.name }));
        store.io.emit('server:participants_updated', participants);
        console.log(`Student disconnected: ${studentId}`);
      } else {
        console.log(`Client disconnected: ${socket.id}`);
      }
    });
  });
};

