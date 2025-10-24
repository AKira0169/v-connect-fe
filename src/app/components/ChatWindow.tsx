'use client';
import { useEffect, useState } from 'react';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ socket, chatId }: any) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!chatId || !socket) return;

    socket.emit('fetch_messages', { withUserId: chatId });

    socket.on('messages', (msgs: any[]) => setMessages(msgs));
    socket.on('new_message', (msg: any) =>
      setMessages((prev) => [...prev, msg]),
    );

    return () => {
      socket.off('messages');
      socket.off('new_message');
    };
  }, [chatId, socket]);

  if (!chatId)
    return (
      <div className="flex items-center justify-center text-gray-500">
        Select a chat to start messaging
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
      <MessageInput socket={socket} receiverId={chatId} />
    </div>
  );
}
