'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import ChatList from '../components/ChatList';
import OnlineUsers from '../components/OnlineUsers';
import ChatWindow from '../components/ChatWindow';

export default function ChatPage() {
  const { socket, connected } = useSocket();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    // ✅ Listen for incoming messages
    socket.on('receive_message', (msg) => {
      console.log('💬 Received:', msg);
    });

    // ✅ Example: ask for online users
    socket.emit('get_online_users');

    return () => {
      socket.off('receive_message');
    };
  }, [socket]);

  const sendMessage = () => {
    socket?.emit('send_message', {
      receiverId: '123',
      content: 'Hello world!',
    });
  };
  return (
    <div className="grid h-screen grid-cols-[300px_200px_1fr] bg-gray-900 text-white">
      <ChatList socket={socket} onSelectChat={setSelectedChat} />
      <OnlineUsers socket={socket} />
      <ChatWindow socket={socket} chatId={selectedChat} />
    </div>
  );
}
