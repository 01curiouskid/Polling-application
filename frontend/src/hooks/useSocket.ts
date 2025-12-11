import { useEffect, useState } from 'react';
import { getSocket, PollSocket } from '../socket/socket';
import { ServerToClientEvents } from '../types';

export const useSocket = () => {
  const [socket, setSocket] = useState<PollSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);
    setIsConnected(socketInstance.connected);

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket, isConnected };
};

export const useSocketEvent = <K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K]
) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, handler as any);

    return () => {
      socket.off(event, handler as any);
    };
  }, [socket, event, handler]);
};

