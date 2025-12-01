import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { PollQuestion } from '../types';
import '../styles/global.css';

interface Participant {
  id: string;
  name: string;
}

const TeacherPage = () => {
  const { socket, isConnected } = useSocket();
  const [currentQuestion, setCurrentQuestion] = useState<PollQuestion | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [correctAnswers, setCorrectAnswers] = useState<{ [index: number]: boolean }>({}); // index -> isCorrect
  const [timeLimit, setTimeLimit] = useState(60);
  const [timer, setTimer] = useState<number | null>(null);
  const [results, setResults] = useState<{ [option: string]: number }>({});
  const [showHistory, setShowHistory] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pollHistory, setPollHistory] = useState<PollQuestion[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; senderId: string; message: string; timestamp: number; isTeacher: boolean }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatTab, setChatTab] = useState<'chat' | 'participants'>('chat');
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!socket) return;

    // Identify as teacher when connected
    if (isConnected) {
      socket.emit('teacher:connect', (response: { success: boolean }) => {
        console.log('Teacher connected:', response);
      });
    }

    const handleQuestionUpdated = (question: PollQuestion) => {
      setCurrentQuestion(question);
      setResults(question.results);
    };

    const handleResultsUpdated = (updatedResults: { [option: string]: number }) => {
      setResults(updatedResults);
    };

    const handleTimerTick = (secondsRemaining: number) => {
      setTimer(secondsRemaining);
    };

    const handleQuestionClosed = () => {
      setCurrentQuestion(null);
      setTimer(null);
      // Refresh history when question closes
      if (isConnected) {
        socket.emit('teacher:get_history', (response) => {
          if (response.success && response.history) {
            setPollHistory(response.history);
          }
        });
      }
    };

    const handleParticipantsUpdated = (updatedParticipants: Array<{ id: string; name: string }>) => {
      setParticipants(updatedParticipants);
    };

    const handleChatMessage = (data: { id: string; sender: string; senderId: string; message: string; timestamp: number; isTeacher: boolean }) => {
      setChatMessages(prev => [...prev, data]);
      // Only increment unread count if chat is not open and message is from student
      if (!showChat && !data.isTeacher) {
        setUnreadMessages(prev => prev + 1);
      }
    };

    const handleHistoryResponse = (response: { success: boolean; history?: PollQuestion[] }) => {
      if (response.success && response.history) {
        setPollHistory(response.history);
      }
    };

    const handleConnect = () => {
      setPollHistory([]); // Clear previous history for new session
    };

    socket.on('server:question_updated', handleQuestionUpdated);
    socket.on('server:results_updated', handleResultsUpdated);
    socket.on('server:timer_tick', handleTimerTick);
    socket.on('server:question_closed', handleQuestionClosed);
    socket.on('server:participants_updated', handleParticipantsUpdated);
    socket.on('server:chat_message', handleChatMessage);
    socket.on('connect', handleConnect);
    socket.on('teacher:history_response', handleHistoryResponse);

    return () => {
      socket.off('server:question_updated', handleQuestionUpdated);
      socket.off('server:results_updated', handleResultsUpdated);
      socket.off('server:timer_tick', handleTimerTick);
      socket.off('server:question_closed', handleQuestionClosed);
      socket.off('server:participants_updated', handleParticipantsUpdated);
      socket.off('server:chat_message', handleChatMessage);
      socket.off('connect', handleConnect);
      socket.off('teacher:history_response', handleHistoryResponse);
    };
  }, [socket, isConnected]);

  // Reset unread messages when chat is opened
  useEffect(() => {
    if (showChat) {
      setUnreadMessages(0);
    }
  }, [showChat]);

  const handleViewHistory = () => {
    if (socket && isConnected) {
      socket.emit('teacher:get_history', (response) => {
        if (response.success && response.history) {
          setPollHistory(response.history);
          setShowHistory(true);
        }
      });
    }
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  
  const handleCorrectAnswerChange = (index: number, isCorrect: boolean) => {
    setCorrectAnswers({ ...correctAnswers, [index]: isCorrect });
  };

  const handleCreateQuestion = () => {
    if (!socket || !isConnected) return;

    const validOptions = options.filter(opt => opt.trim() !== '');
    if (questionText.trim() === '' || validOptions.length < 2) {
      alert('Please provide a question and at least 2 options');
      return;
    }

    // Find the correct answer based on Yes/No selection
    let correctAnswer: string | undefined;
    Object.keys(correctAnswers).forEach(key => {
      const index = parseInt(key);
      if (correctAnswers[index] && validOptions[index]) {
        correctAnswer = validOptions[index];
      }
    });

    socket.emit('teacher:create_question', {
      question: questionText.trim(),
      options: validOptions,
      correctAnswer,
      timeLimit,
    }, (response) => {
      if (response.success && response.question) {
        setCurrentQuestion(response.question);
        setQuestionText('');
        setOptions(['', '']);
        setCorrectAnswers({});
      } else {
        alert(response.error || 'Failed to create question');
      }
    });
  };

  const handleEndQuestion = () => {
    if (!socket || !isConnected) return;

    socket.emit('teacher:end_question', (response) => {
      if (response.success) {
        setCurrentQuestion(null);
        setTimer(null);
      }
    });
  };

  const handleSendChatMessage = () => {
    if (!socket || !isConnected || !chatInput.trim()) return;

    socket.emit('teacher:send_message', {
      message: chatInput.trim(),
    }, (response) => {
      if (response.success) {
        setChatInput('');
      } else {
        alert(response.error || 'Failed to send message');
      }
    });
  };

  const handleKickParticipant = (participantId: string, participantName: string) => {
    if (!socket || !isConnected) return;
    
    if (window.confirm(`Are you sure you want to kick ${participantName}?`)) {
      socket.emit('teacher:kick_participant' as any, { 
        participantId 
      }, (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          alert(response.error || 'Failed to kick participant');
        }
      });
    }
  };

  const canCreateQuestion = !currentQuestion || currentQuestion.status === 'closed';
  const questionCharCount = questionText.length;
  const maxQuestionLength = 100;

  return (
    <div style={{
      minHeight: '100vh',
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#F9FAFB',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
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
          marginBottom: '1rem',
        }}>
          <span>⚡</span>
          <span>Intervue Poll</span>
        </div>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Let's Get Started
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>
          you'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'flex-end' }}>
        <button
          onClick={handleViewHistory}
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
          View Poll History
        </button>
      </div>

      {!currentQuestion ? (
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          {/* Question Input Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: '600', fontSize: 'var(--font-size-base)' }}>
                Enter your question
              </label>
              <select
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                }}
              >
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={90}>90 seconds</option>
                <option value={120}>120 seconds</option>
              </select>
            </div>
            <div style={{ position: 'relative' }}>
              <textarea
                value={questionText}
                onChange={(e) => {
                  if (e.target.value.length <= maxQuestionLength) {
                    setQuestionText(e.target.value);
                  }
                }}
                placeholder="Enter your question here..."
                maxLength={maxQuestionLength}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  minHeight: '120px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '0.75rem',
                right: '0.75rem',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
              }}>
                {questionCharCount}/{maxQuestionLength}
              </div>
            </div>
          </div>

          {/* Options Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            {/* Edit Options */}
            <div>
              <h3 style={{ marginBottom: '1rem', fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
                Edit Options
              </h3>
              {options.map((option, index) => (
                <div key={index} style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', minHeight: '48px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#6366F1',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    flexShrink: 0,
                  }}>
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-base)',
                      height: '48px',
                    }}
                  />
                </div>
              ))}
              <button
                onClick={handleAddOption}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#6366F1',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Add More option
              </button>
            </div>

            {/* Is It Correct? */}
            <div>
              <h3 style={{ marginBottom: '1rem', fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
                Is It Correct?
              </h3>
              {options.map((option, index) => {
                if (option.trim() === '') return null;
                const isCorrect = correctAnswers[index] === true;
                const isIncorrect = correctAnswers[index] === false;
                
                return (
                  <div key={index} style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', minHeight: '48px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#6366F1',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', height: '48px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, userSelect: 'none', height: '100%' }}>
                        <input
                          type="radio"
                          name={`correct-${index}`}
                          checked={isCorrect}
                          onChange={() => handleCorrectAnswerChange(index, true)}
                          style={{ cursor: 'pointer', margin: 0, width: '18px', height: '18px' }}
                        />
                        <span style={{ margin: 0, fontSize: 'var(--font-size-base)' }}>Yes</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, userSelect: 'none', height: '100%' }}>
                        <input
                          type="radio"
                          name={`correct-${index}`}
                          checked={isIncorrect}
                          onChange={() => handleCorrectAnswerChange(index, false)}
                          style={{ cursor: 'pointer', margin: 0, width: '18px', height: '18px' }}
                        />
                        <span style={{ margin: 0, fontSize: 'var(--font-size-base)' }}>No</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ask Question Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCreateQuestion}
              disabled={!canCreateQuestion || !isConnected}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: '600',
                cursor: canCreateQuestion && isConnected ? 'pointer' : 'not-allowed',
                border: 'none',
                opacity: canCreateQuestion && isConnected ? 1 : 0.6,
              }}
            >
              Ask Question
            </button>
          </div>
        </div>
      ) : (
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
            <h3 style={{ marginBottom: '1rem', fontSize: 'var(--font-size-xl)' }}>Live Results</h3>
            {currentQuestion.options.map((option, index) => {
              const count = results[option] || 0;
              const total = Object.values(results).reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const isCorrect = currentQuestion.correctAnswer === option;

              return (
                <div key={option} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
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
                      </span>
                      {option}
                      {isCorrect && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: 'var(--success-color)',
                          color: 'white',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: '600',
                        }}>
                          ✓ Correct
                        </span>
                      )}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {count} vote{count !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '32px',
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: isCorrect ? '2px solid var(--success-color)' : 'none',
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: isCorrect ? 'var(--success-color)' : '#6366F1',
                      transition: 'width 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '600',
                    }}>
                      {percentage > 10 && `${percentage.toFixed(0)}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleEndQuestion}
            disabled={!isConnected}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: 'var(--danger-color)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: '600',
              cursor: isConnected ? 'pointer' : 'not-allowed',
            }}
          >
            End Poll
          </button>
        </div>
      )}

      {/* Poll History Modal */}
      {showHistory && (
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
        }} onClick={() => setShowHistory(false)}>
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
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                View Poll History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#6B7280',
                }}
              >
                ×
              </button>
            </div>
            {pollHistory.length === 0 ? (
              <p style={{ color: '#6B7280', textAlign: 'center', padding: '2rem' }}>
                No poll history yet
              </p>
            ) : (
              <div>
                {pollHistory.map((poll, pollIndex) => {
                  const total = Object.values(poll.results).reduce((sum, val) => sum + val, 0);
                  return (
                    <div key={poll.id} style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: pollIndex < pollHistory.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                      <div style={{ marginBottom: '0.5rem', fontWeight: '600', fontSize: '1.125rem' }}>
                        Question {pollIndex + 1}
                      </div>
                      <div style={{
                        backgroundColor: '#374151',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: '0.375rem',
                        marginBottom: '1rem',
                        fontSize: '1rem',
                      }}>
                        {poll.question}
                      </div>
                      {poll.options.map((option, index) => {
                        const count = poll.results[option] || 0;
                        const percentage = total > 0 ? (count / total) * 100 : 0;
                        const isCorrect = poll.correctAnswer === option;
                        
                        // Get students who selected this option
                        const studentsWhoSelected = poll.studentAnswers 
                          ? Object.entries(poll.studentAnswers)
                              .filter(([_, selectedOption]) => selectedOption === option)
                              .map(([studentId, _]) => {
                                const participant = participants.find(p => p.id === studentId);
                                return participant ? participant.name : studentId;
                              })
                          : [];
                        
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
                                fontSize: '0.75rem',
                                fontWeight: '600',
                              }}>
                                {index + 1}
                              </div>
                              <span style={{
                                fontWeight: isCorrect ? '600' : '400',
                                color: isCorrect ? '#10B981' : '#111827',
                              }}>
                                {option}
                              </span>
                              <span style={{ marginLeft: 'auto', color: '#6B7280', fontSize: '0.875rem' }}>
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '24px',
                              backgroundColor: '#F3F4F6',
                              borderRadius: '0.25rem',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                backgroundColor: isCorrect ? '#10B981' : '#6366F1',
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                            {studentsWhoSelected.length > 0 && (
                              <div style={{
                                marginTop: '0.5rem',
                                fontSize: '0.75rem',
                                color: '#6B7280',
                                paddingLeft: '1.5rem',
                              }}>
                                Selected by: {studentsWhoSelected.join(', ')}
                              </div>
                            )}
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
                    const isOwnMessage = msg.isTeacher;
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
                  disabled={!chatInput.trim() || !isConnected}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: chatInput.trim() && isConnected ? '#6366F1' : 'var(--secondary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: chatInput.trim() && isConnected ? 'pointer' : 'not-allowed',
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
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <span>{participant.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKickParticipant(participant.id, participant.name);
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#DC2626';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#EF4444';
                      }}
                    >
                      Kick
                    </button>
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
    </div>
  );
};

export default TeacherPage;
