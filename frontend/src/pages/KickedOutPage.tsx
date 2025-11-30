import { useEffect } from 'react';

const KickedOutPage = () => {
  useEffect(() => {
    localStorage.removeItem('studentId');
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      padding: '2rem',
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
        color: '#000000',
        fontSize: '3rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
      }}>
        You had been kicked out!
      </h1>
      <p style={{
        color: '#9CA3AF',
        fontSize: '1.125rem',
        lineHeight: '1.75',
        maxWidth: '500px',
      }}>
        Looks like teacher has removed you from the poll system.
        <br />
        Try again later.
      </p>
    </div>
  );
};

export default KickedOutPage;
