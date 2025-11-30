import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';

const HomePage = () => {
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedRole === 'teacher') {
      navigate('/teacher');
    } else if (selectedRole === 'student') {
      navigate('/student');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F9FAFB',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '700px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '3rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
      }}>
        <div style={{
          marginBottom: '2rem',
          padding: '0.5rem 1.5rem',
          backgroundColor: '#8B5CF6',
          color: 'white',
          borderRadius: '9999px',
          fontWeight: '600',
          fontSize: '0.875rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span>⚡</span> Intervue Poll
        </div>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '1rem',
        }}>
          Welcome to the Live Polling System
        </h1>
        <p style={{
          color: '#6B7280',
          marginBottom: '3rem',
          fontSize: '1.125rem',
          lineHeight: '1.5',
        }}>
          Please select the role that best describes you to begin using the live polling system
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginBottom: '3rem',
        }}>
          {/* Student Card */}
          <div
            onClick={() => setSelectedRole('student')}
            style={{
              padding: '2rem',
              borderRadius: '0.75rem',
              border: `2px solid ${selectedRole === 'student' ? '#6366F1' : '#E5E7EB'}`,
              backgroundColor: selectedRole === 'student' ? '#EEF2FF' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
            }}
            onMouseOver={(e) => {
              if (selectedRole !== 'student') {
                e.currentTarget.style.borderColor = '#6366F1';
                e.currentTarget.style.backgroundColor = '#F9FAFB';
              }
            }}
            onMouseOut={(e) => {
              if (selectedRole !== 'student') {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '1rem',
            }}>
              I'm a Student
            </h3>
            <p style={{
              color: '#6B7280',
              fontSize: '1rem',
              lineHeight: '1.5',
            }}>
              Join a live polling session created by your teacher. Participate in real-time polls and see instant results.
            </p>
          </div>

          {/* Teacher Card */}
          <div
            onClick={() => setSelectedRole('teacher')}
            style={{
              padding: '2rem',
              borderRadius: '0.75rem',
              border: `2px solid ${selectedRole === 'teacher' ? '#6366F1' : '#E5E7EB'}`,
              backgroundColor: selectedRole === 'teacher' ? '#EEF2FF' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
            }}
            onMouseOver={(e) => {
              if (selectedRole !== 'teacher') {
                e.currentTarget.style.borderColor = '#6366F1';
                e.currentTarget.style.backgroundColor = '#F9FAFB';
              }
            }}
            onMouseOut={(e) => {
              if (selectedRole !== 'teacher') {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '1rem',
            }}>
              I'm a Teacher
            </h3>
            <p style={{
              color: '#6B7280',
              fontSize: '1rem',
              lineHeight: '1.5',
            }}>
              Create and manage live polling sessions. Ask questions, track responses, and engage with your students in real-time.
            </p>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          style={{
            width: '100%',
            padding: '1rem',
            background: selectedRole 
              ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
              : '#E5E7EB',
            color: selectedRole ? 'white' : '#9CA3AF',
            borderRadius: '0.5rem',
            border: 'none',
            fontSize: '1.125rem',
            fontWeight: '600',
            cursor: selectedRole ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            if (selectedRole) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
            }
          }}
          onMouseOut={(e) => {
            if (selectedRole) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default HomePage;

