'use client';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    socket = io(url, {
      transports: ['websocket'], // always force WebSocket
      withCredentials: true, // allows cookies (if using JWT in cookies)
      autoConnect: false,
    });

    // 🧩 Add logs to confirm behavior
    socket.on('connect', () => console.log('🟢 Socket connected:', socket?.id));
    socket.on('disconnect', (reason) =>
      console.log('🔴 Disconnected:', reason),
    );
    socket.on('connect_error', (err) =>
      console.error('❌ Connect error:', err.message),
    );
  }
  return socket;
};

export const connectSocket = (): Socket => {
  const sock = getSocket();
  if (!sock.connected) sock.connect();
  return sock;
};

export const disconnectSocket = (): void => {
  if (socket?.connected) socket.disconnect();
};
