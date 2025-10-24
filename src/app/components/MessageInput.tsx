'use client';
import { useState } from 'react';

export default function MessageInput({ socket, receiverId }: any) {
  const [content, setContent] = useState('');

  const sendMessage = () => {
    if (!content.trim()) return;
    socket.emit('send_message', { receiverId, content });
    setContent('');
  };

  return (
    <div className="flex border-t border-gray-800 p-3">
      <input
        className="flex-1 rounded-lg bg-gray-800 px-3 py-2 text-white outline-none"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Type a message..."
      />
      <button
        onClick={sendMessage}
        className="ml-2 rounded-lg bg-blue-600 px-4 py-2"
      >
        Send
      </button>
    </div>
  );
}
