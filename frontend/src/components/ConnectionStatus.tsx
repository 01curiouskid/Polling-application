import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

const ConnectionStatus = () => {
    const { isConnected } = useSocket();
    const [showStatus, setShowStatus] = useState(true);
    const [showConnected, setShowConnected] = useState(false);

    useEffect(() => {
        if (isConnected) {
            // Show "Connected" for a moment, then hide
            setShowConnected(true);
            const timer = setTimeout(() => {
                setShowStatus(false);
                setShowConnected(false);
            }, 2000);
            return () => clearTimeout(timer);
        } else {
            // Show status immediately when disconnected
            setShowStatus(true);
            setShowConnected(false);
        }
    }, [isConnected]);

    if (!showStatus) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: showConnected ? '#10B981' : '#F59E0B', // Green for success, Orange for waiting
            color: 'white',
            padding: '0.5rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'background-color 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
        }}>
            {!showConnected && (
                <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }} />
            )}
            <span>
                {showConnected
                    ? 'Connected to server!'
                    : 'Waking up server... (This may take up to 60s)'}
            </span>
        </div>
    );
};

export default ConnectionStatus;
