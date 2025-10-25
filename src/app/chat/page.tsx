'use client';

import { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import ChatList from '../components/ChatList';

export default function ChatPage() {
  const { socket } = useSocket();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  return (
    <div className="grid h-screen grid-cols-[300px_200px_1fr] bg-[#161717] text-white">
      <ChatList socket={socket} onSelectChat={setSelectedChat} />
    </div>
  );
}
