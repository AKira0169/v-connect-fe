'use client';
import { useEffect, useState, useMemo } from 'react';
import type { Socket } from 'socket.io-client';
import { User } from '@/api/auth.api';
import { useGetCurrentUser } from '../hooks/useAuth';
import { useGetChat } from '../hooks/useChat';
import { ChatItem } from '@/types/Chat';

interface ChatListProps {
  socket: Socket | null;
  onSelectChat: (receiverId: string) => void;
}

export default function ChatList({ socket, onSelectChat }: ChatListProps) {
  const { chats } = useGetChat();
  const { currentUser } = useGetCurrentUser();
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (users: User[]) => {
      console.log('Online users received:', users);
      setOnlineUsers(users);
    };

    socket.on('online_users', handleOnlineUsers);

    // Cleanup
    return () => {
      socket.off('online_users', handleOnlineUsers); // make sure to remove the same handler
    };
  }, [socket]);

  const unifiedList = useMemo(() => {
    if (!currentUser) return [];

    const myId = currentUser.id;

    console.log('Current user:', currentUser);
    console.log('Chats from API:', chats);

    // Existing chats
    const filteredChats: ChatItem[] = (chats || []).map((chat) => {
      const otherParticipants = chat.participants.filter((p) => p.id !== myId);
      return {
        ...chat,
        participants: otherParticipants.length
          ? otherParticipants
          : chat.participants,
        isOnline: otherParticipants.some((p) =>
          onlineUsers.some((u) => u.id === p.id),
        ),
      };
    });

    console.log('Mapped chats:', filteredChats);

    // Online users not already in chats
    const chatUserIds = new Set(
      (chats || []).flatMap((c) => c.participants.map((p) => p.id)),
    );

    const newUsers: ChatItem[] = onlineUsers
      .filter((u) => u.id !== myId && !chatUserIds.has(u.id))
      .map((u) => ({
        id: '',
        participants: [u],
        lastMessage: { content: 'No messages' },
        unreadCount: 0,
        isOnline: true,
      }));

    console.log('New online users to start chat:', newUsers);

    return [...filteredChats, ...newUsers];
  }, [chats, onlineUsers, currentUser]);

  return (
    <div className="overflow-y-auto border-r border-gray-800">
      {unifiedList.length === 0 && (
        <div className="p-4 text-gray-400">No chats available</div>
      )}
      {unifiedList.map((chat) => {
        const receiver =
          chat.participants.find((p) => p.id !== currentUser!.id) ||
          chat.participants[0];
        return (
          <div
            key={chat.id || receiver.id}
            onClick={() => onSelectChat(receiver.id)}
            className="flex cursor-pointer items-center justify-between border-b border-gray-800 p-4 hover:bg-gray-800"
          >
            <div>
              <div className="font-semibold">
                {chat.participants
                  .map((p) => `${p.firstName} ${p.lastName}`)
                  .join(', ')}
                {!chat.isOnline && ' (offline)'}
              </div>
              <div className="text-sm text-gray-400">
                {chat.lastMessage?.content || 'No messages'}
              </div>
            </div>
            {chat.isOnline && (
              <div className="h-3 w-3 rounded-full bg-green-400" />
            )}
          </div>
        );
      })}
    </div>
  );
}
