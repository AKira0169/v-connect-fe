'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Create the socket outside the state setter to avoid "setState in effect" warning
    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com',
      { withCredentials: true, transports: ['websocket'] },
    );

    socketRef.current = socketInstance;

    // Update state asynchronously (after socket is created)
    queueMicrotask(() => setSocket(socketInstance));

    socketInstance.on('connect', () => setConnected(true));
    socketInstance.on('disconnect', () => setConnected(false));

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, []);

  return { socket, connected };
};
