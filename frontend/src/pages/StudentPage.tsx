import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { PollQuestion } from '../types';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';

const StudentPage = () => {
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<PollQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [results, setResults] = useState<{ [option: string]: number }>({});
  const [timer, setTimer] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [pastPerformance, setPastPerformance] = useState<PollQuestion[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; senderId: string; message: string; timestamp: number; isTeacher: boolean }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatTab, setChatTab] = useState<'chat' | 'participants'>('chat');
  const [participants, setParticipants] = useState<Array<{ id: string; name: string }>>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Don't auto-load from localStorage - each tab should ask for name
  // Removed auto-loading logic

  // Set up socket handlers - this should run whenever socket is available
  // Handlers should be set up immediately, not waiting for hasEnteredName
  // This ensures we receive questions even if they're sent before student joins
  useEffect(() => {
    if (!socket) return;

    const handleQuestionUpdated = (question: PollQuestion) => {
      // Always update question state - don't check hasEnteredName here
      // The question will be shown once student has entered name
      // This ensures questions are received even if sent before student joins
      setCurrentQuestion(question);
      setSelectedOption(null);
      setHasAnswered(false);
      setIsLocked(false);
      setResults(question.results);
      // Reset timer when new question arrives
      if (question.status === 'active') {
        const now = Date.now();
        const secondsRemaining = Math.max(0, Math.ceil((question.expiresAt - now) / 1000));
        setTimer(secondsRemaining);
      }
    };

    const handleResultsUpdated = (updatedResults: { [option: string]: number }) => {
      setResults(updatedResults);
    };

    const handleTimerTick = (secondsRemaining: number) => {
      setTimer(secondsRemaining);
      if (secondsRemaining === 0) {
        // Timer expired - if student hasn't answered, lock them out
        // But don't set hasAnswered to true if they haven't answered yet
        // The question will be closed by the server, which will trigger handleQuestionClosed
        if (!hasAnswered) {
          setIsLocked(true);
        }
      }
    };

    const handleQuestionClosed = () => {
      // When question closes, clear it and reset state to show waiting screen
      setCurrentQuestion(null);
      setHasAnswered(false);
      setIsLocked(false);
      setSelectedOption(null);
      setResults({});
      setTimer(null);
    };

    const handleChatMessage = (data: { id: string; sender: string; senderId: string; message: string; timestamp: number; isTeacher: boolean }) => {
      setChatMessages(prev => [...prev, data]);
      // Only increment unread count if chat is not open and message is from teacher
      if (!showChat && data.isTeacher) {
        setUnreadMessages(prev => prev + 1);
      }
    };

    const handleParticipantsUpdated = (updatedParticipants: Array<{ id: string; name: string }>) => {
      setParticipants(updatedParticipants);
    };

    const handleKicked = () => {
      navigate('/kicked-out');
    };

    socket.on('server:question_updated', handleQuestionUpdated);
    socket.on('server:results_updated', handleResultsUpdated);
    socket.on('server:timer_tick', handleTimerTick);
    socket.on('server:question_closed', handleQuestionClosed);
    socket.on('server:chat_message', handleChatMessage);
    socket.on('server:participants_updated', handleParticipantsUpdated);
    socket.on('server:kicked' as any, handleKicked);

    return () => {
      socket.off('server:question_updated', handleQuestionUpdated);
      socket.off('server:results_updated', handleResultsUpdated);
      socket.off('server:timer_tick', handleTimerTick);
      socket.off('server:question_closed', handleQuestionClosed);
      socket.off('server:chat_message', handleChatMessage);
      socket.off('server:participants_updated', handleParticipantsUpdated);
      socket.off('server:kicked' as any, handleKicked);
    };
  }, [socket]);

  // Reset unread messages when chat is opened
  useEffect(() => {
    if (showChat) {
      setUnreadMessages(0);
    }
  }, [showChat]); // Remove hasEnteredName and hasAnswered from dependencies - handlers should always be active

  // When student joins, the backend automatically sends current question if it exists
  // The socket handlers are already set up, so the question will be received
  // No need for additional request - backend handles it in the join handler

  const handleNameSubmit = () => {
    if (!socket || !isConnected || !studentName.trim()) return;

    socket.emit('student:join', { name: studentName.trim() }, (response) => {
      if (response.success && response.studentId) {
        setStudentId(response.studentId);
        setHasEnteredName(true);
        // Don't save to localStorage - each tab should ask for name
        // The backend will send the current question if one exists via the join handler
        // The socket handlers are already set up, so the question will be received immediately
      } else {
        alert(response.error || 'Failed to join');
      }
    });
  };

  // Ensure question is visible once student has entered name
  // This handles the case where question was received before name was entered
  useEffect(() => {
    if (hasEnteredName && currentQuestion && currentQuestion.status === 'active') {
      // Question is already set, just ensure timer is initialized
      const now = Date.now();
      const secondsRemaining = Math.max(0, Math.ceil((currentQuestion.expiresAt - now) / 1000));
      if (timer === null || timer !== secondsRemaining) {
        setTimer(secondsRemaining);
      }
    }
  }, [hasEnteredName, currentQuestion, timer]);

  const handleSubmitAnswer = () => {
    if (!socket || !isConnected || !currentQuestion || !selectedOption || hasAnswered) return;

    socket.emit('student:submit_answer', {
      questionId: currentQuestion.id,
      option: selectedOption,
    }, (response) => {
      if (response.success) {
        setHasAnswered(true);
      } else {
        alert(response.error || 'Failed to submit answer');
      }
    });
  };

  const handleGetPerformance = () => {
    if (!socket || !isConnected) return;

    socket.emit('student:get_performance', (response) => {
      if (response.success && response.performance) {
        setPastPerformance(response.performance);
        setShowPerformance(true);
      } else {
        alert(response.error || 'Failed to get performance');
      }
    });
  };

  const handleSendChatMessage = () => {
    if (!socket || !isConnected || !chatInput.trim() || !studentName) return;

    socket.emit('student:send_message', {
      message: chatInput.trim(),
    }, (response) => {
      if (response.success) {
        setChatInput('');
      } else {
        alert(response.error || 'Failed to send message');
      }
    });
  };

  if (!hasEnteredName) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: '#F9FAFB',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          width: '100%',
        }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: 'var(--font-size-2xl)' }}>
            Enter Your Name
          </h2>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="Your name"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-base)',
              }}
            />
          </div>
          <button
            onClick={handleNameSubmit}
            disabled={!studentName.trim()}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: studentName.trim() ? 'var(--primary-color)' : 'var(--secondary-color)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: '600',
              cursor: studentName.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Join Poll
          </button>
                  </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#F9FAFB',
    }}>
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#6366F1',
          color: 'white',
          borderRadius: '9999px',
          fontSize: 'var(--font-size-sm)',
          fontWeight: '600',
        }}>
          <span>⚡</span>
          <span>Intervue Poll</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={handleGetPerformance}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'white',
              color: 'var(--primary-color)',
              border: '1px solid var(--primary-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            My Performance
          </button>
          <span style={{ color: 'var(--text-secondary)' }}>{studentName}</span>
        </div>
      </div>

      {!currentQuestion ? (
        <div style={{
          backgroundColor: 'white',
          padding: '4rem 2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #6366F1',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem',
          }} />
          <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)' }}>
            Wait for the teacher to ask questions..
          </p>
        </div>
      ) : hasAnswered && (timer === null || timer > 0) ? (
        // Waiting screen after answering (while timer is still running)
        <div style={{
          backgroundColor: 'white',
          padding: '4rem 2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #6366F1',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem',
          }} />
          <h2 style={{ marginBottom: '1rem', fontSize: 'var(--font-size-2xl)' }}>
            Answer Submitted!
          </h2>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Waiting for other students to answer...
          </p>
          {timer !== null && timer > 0 && (
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6366F1',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: '600',
              display: 'inline-block',
            }}>
              {timer}s remaining
            </div>
          )}
        </div>
      ) : hasAnswered || isLocked ? (
        // Results view
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ marginBottom: '1rem', fontWeight: '600', fontSize: 'var(--font-size-base)' }}>
            Question
          </div>
          <div style={{
            backgroundColor: '#374151',
            color: 'white',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: 'var(--font-size-base)',
          }}>
            {currentQuestion.question}
          </div>
          {currentQuestion.options.map((option, index) => {
            const count = results[option] || 0;
            const total = Object.values(results).reduce((sum, val) => sum + val, 0);
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const isSelected = selectedOption === option;

            return (
              <div key={option} style={{ marginBottom: '1rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#6366F1',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: '600',
                  }}>
                    {index + 1}
                  </div>
                  <span style={{
                    fontWeight: isSelected ? '600' : '400',
                    color: isSelected ? '#6366F1' : 'var(--text-primary)',
                  }}>
                    {option}
                  </span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '32px',
                  backgroundColor: '#F3F4F6',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: '#6366F1',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Answer selection view
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>{currentQuestion.question}</h2>
            {timer !== null && (
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: timer < 10 ? 'var(--danger-color)' : 'var(--primary-color)',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: '600',
              }}>
                {timer}s
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            {currentQuestion.options.map((option, index) => (
              <label
                key={option}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  border: `2px solid ${selectedOption === option ? '#6366F1' : '#E5E7EB'}`,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: selectedOption === option ? '#EEF2FF' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={selectedOption === option}
                  onChange={() => setSelectedOption(option)}
                  style={{ cursor: 'pointer' }}
                />
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#6366F1',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: '600',
                }}>
                  {index + 1}
                </div>
                <span style={{ flex: 1 }}>{option}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedOption || isLocked}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: selectedOption && !isLocked ? '#6366F1' : 'var(--secondary-color)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: '600',
              cursor: selectedOption && !isLocked ? 'pointer' : 'not-allowed',
            }}
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Past Performance Modal */}
      {showPerformance && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          overflow: 'auto',
          padding: '2rem',
        }} onClick={() => setShowPerformance(false)}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}>
              <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold' }}>
                My Past Performance
              </h2>
              <button
                onClick={() => setShowPerformance(false)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: 'var(--font-size-xl)',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                ×
              </button>
            </div>
            {pastPerformance.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                No past performance data yet
              </p>
            ) : (
              <div>
                {pastPerformance.map((poll, pollIndex) => {
                  const total = Object.values(poll.results).reduce((sum, val) => sum + val, 0);
                  const studentAnswer = poll.studentAnswer;
                  const isCorrect = poll.correctAnswer === studentAnswer;
                  
                  return (
                    <div key={poll.id} style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: pollIndex < pastPerformance.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <div style={{ marginBottom: '0.5rem', fontWeight: '600', fontSize: 'var(--font-size-lg)' }}>
                        Question {pollIndex + 1}
                      </div>
                      <div style={{
                        backgroundColor: '#374151',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                        fontSize: 'var(--font-size-base)',
                      }}>
                        {poll.question}
                      </div>
                      <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: isCorrect ? '#D1FAE5' : '#FEE2E2', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          Your Answer: {studentAnswer || 'N/A'}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                          {isCorrect ? '✓ Correct!' : poll.correctAnswer ? `✗ Correct answer: ${poll.correctAnswer}` : 'No correct answer marked'}
                        </div>
                      </div>
                      {poll.options.map((option, index) => {
                        const count = poll.results[option] || 0;
                        const percentage = total > 0 ? (count / total) * 100 : 0;
                        const isStudentAnswer = studentAnswer === option;
                        
                        return (
                          <div key={option} style={{ marginBottom: '0.75rem' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.25rem',
                            }}>
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: '#6366F1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: '600',
                              }}>
                                {index + 1}
                              </div>
                              <span style={{
                                fontWeight: isStudentAnswer ? '600' : '400',
                                color: isStudentAnswer ? '#6366F1' : 'var(--text-primary)',
                              }}>
                                {option}
                              </span>
                              <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '24px',
                              backgroundColor: '#F3F4F6',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                backgroundColor: '#6366F1',
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Popup Button */}
      <button
        onClick={() => setShowChat(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#6366F1',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          zIndex: 999,
        }}
      >
        💬
        {unreadMessages > 0 && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '20px',
            height: '20px',
            backgroundColor: '#EF4444',
            color: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            border: '2px solid white',
          }}>
            {unreadMessages > 99 ? '99+' : unreadMessages}
          </div>
        )}
      </button>

      {/* Chat Popup Modal */}
      {showChat && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '2rem',
          width: '400px',
          maxHeight: '600px',
          backgroundColor: 'white',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <button
              onClick={() => setChatTab('chat')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                borderBottom: chatTab === 'chat' ? '2px solid #6366F1' : '2px solid transparent',
                color: chatTab === 'chat' ? '#6366F1' : 'var(--text-secondary)',
                fontWeight: chatTab === 'chat' ? '600' : '400',
              }}
            >
              Chat
            </button>
            <button
              onClick={() => setChatTab('participants')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                borderBottom: chatTab === 'participants' ? '2px solid #6366F1' : '2px solid transparent',
                color: chatTab === 'participants' ? '#6366F1' : 'var(--text-secondary)',
                fontWeight: chatTab === 'participants' ? '600' : '400',
              }}
            >
              Participants
            </button>
          </div>

          {/* Chat Content */}
          {chatTab === 'chat' ? (
            <>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                minHeight: '400px',
                maxHeight: '400px',
              }}>
                {chatMessages.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    padding: '2rem',
                  }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isOwnMessage = msg.senderId === studentId;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          marginBottom: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div style={{
                          color: '#6366F1',
                          fontSize: 'var(--font-size-xs)',
                          marginBottom: '0.25rem',
                          fontWeight: '600',
                        }}>
                          {msg.sender}
                        </div>
                        <div style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          maxWidth: '70%',
                          backgroundColor: isOwnMessage ? '#6366F1' : '#E5E7EB',
                          color: isOwnMessage ? 'white' : 'var(--text-primary)',
                        }}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div style={{
                padding: '1rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                gap: '0.5rem',
              }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={!chatInput.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: chatInput.trim() ? '#6366F1' : 'var(--secondary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                  }}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div style={{
              padding: '1rem',
              overflowY: 'auto',
              minHeight: '400px',
              maxHeight: '400px',
            }}>
              {participants.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  padding: '2rem',
                }}>
                  No participants
                </div>
              ) : (
                participants.map((participant) => (
                  <div
                    key={participant.id}
                    style={{
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {participant.name}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={() => setShowChat(false)}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: 'var(--text-secondary)',
            }}
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StudentPage;
