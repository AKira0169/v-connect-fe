'use client';
import { useEffect, useState } from 'react';

export default function OnlineUsers({ socket }: any) {
  const [online, setOnline] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('get_online_users');
    socket.on('online_users', (users: string[]) => setOnline(users));

    return () => {
      socket.off('online_users');
    };
  }, [socket]);

  return (
    <div className="overflow-y-auto border-r border-gray-800 p-4">
      <h2 className="mb-3 text-lg font-bold">Online</h2>
      {online.map((u) => (
        <div key={u} className="py-1 text-sm text-green-400">
          {u}
        </div>
      ))}
    </div>
  );
}
