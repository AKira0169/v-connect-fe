'use client';
import { useQuery } from '@tanstack/react-query';

export default function ChatList({ socket, onSelectChat }: any) {
  const { data: chats, isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const res = await fetch('/api/chat', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return res.json();
    },
  });

  if (isLoading) return <div className="p-4">Loading...</div>;

  return (
    <div className="overflow-y-auto border-r border-gray-800">
      {chats?.map((chat: any) => (
        <div
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className="cursor-pointer border-b border-gray-800 p-4 hover:bg-gray-800"
        >
          <div className="font-semibold">{chat.participants[0]?.name}</div>
          <div className="text-sm text-gray-400">
            {chat.lastMessage?.content || 'No messages'}
          </div>
        </div>
      ))}
    </div>
  );
}
