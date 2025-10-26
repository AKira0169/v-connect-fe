'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/utils/apiClient';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type Message = {
  id: string;
  chatId: string;
  sender: User;
  content: string;
  createdAt: string;
};

type Chat = {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
};

// ✅ API helpers
const fetchCurrentUser = async (): Promise<User> => {
  const { data } = await apiClient.get('/user/me', { withCredentials: true });
  return data.data;
};

const fetchChats = async (): Promise<Chat[]> => {
  const { data } = await apiClient.get('/chats', { withCredentials: true });
  return data.data;
};

const fetchMessages = async (chatId: string): Promise<Message[]> => {
  const { data } = await apiClient.get(`/messages/${chatId}`, {
    withCredentials: true,
  });
  return data.data || [];
};

export default function ChatPage() {
  const { socket } = useSocket(); // ✅ socket initialized with cookies
  const queryClient = useQueryClient();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 🟢 Fetch current user
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchCurrentUser,
  });

  // 🟢 Fetch chats
  const { data: chats = [], isLoading: chatsLoading } = useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: fetchChats,
    enabled: !!me,
  });

  // 🟢 Fetch messages
  const {
    data: messages = [],
    isLoading: messagesLoading,
    isError: messagesError,
  } = useQuery<Message[]>({
    queryKey: ['messages', selectedChatId],
    queryFn: () => fetchMessages(selectedChatId!),
    enabled: !!selectedChatId && !!me,
  });

  // ✅ Sort messages oldest → newest
  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [messages]);

  // ✅ Get receiver ID
  const getReceiverId = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat || !me) return '';
    return chat.participants.find((p) => p.id !== me.id)?.id || '';
  };

  // 🟢 Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedChatId || !me) return;
      const receiverId = getReceiverId(selectedChatId);
      if (!receiverId) return console.warn('No receiver found');
      socket?.emit('send_message', { receiverId, content });
    },
    onSuccess: () => setMessageInput(''),
  });

  // 🧩 Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData<Message[]>(
        ['messages', message.chatId],
        (old = []) => {
          if (old.some((m) => m.id === message.id)) return old;
          return [...old, message];
        },
      );

      queryClient.setQueryData<Chat[]>(['chats'], (old = []) =>
        old.map((chat) =>
          chat.id === message.chatId ? { ...chat, lastMessage: message } : chat,
        ),
      );

      if (message.chatId === selectedChatId) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, queryClient, selectedChatId]);

  // 🧩 Join selected chat room
  useEffect(() => {
    if (socket && selectedChatId) {
      socket.emit('join_chat', { chatId: selectedChatId });
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [socket, selectedChatId]);

  // 🧹 Scroll to bottom on update
  useEffect(() => {
    if (selectedChatId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sortedMessages.length, selectedChatId]);

  if (meLoading || chatsLoading)
    return <div className="p-6 text-white">Loading chats...</div>;

  return (
    <div className="grid h-screen grid-cols-3 bg-[#161717]">
      {/* 🟢 Chat List */}
      <div className="h-full overflow-y-auto border-r border-gray-700">
        <h2 className="p-4 text-lg font-bold text-white">Chats</h2>
        {chats.length === 0 ? (
          <div className="p-4 text-gray-400">No chats yet</div>
        ) : (
          chats.map((chat) => {
            const receiver = chat.participants.find((p) => p.id !== me?.id);
            return (
              <div
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`cursor-pointer p-4 transition hover:bg-[#2e2f2f] ${
                  chat.id === selectedChatId ? 'bg-[#2e2f2f]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">
                    {receiver?.firstName} {receiver?.lastName}
                  </span>
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <span className="rounded-full bg-blue-500 px-2 py-1 text-xs text-white">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-gray-400">
                  {chat.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* 💬 Chat Window */}
      <div className="col-span-2 flex h-screen flex-col overflow-hidden">
        {!selectedChatId ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        ) : (
          <>
            {/* 🧩 Messages */}
            <div className="flex flex-1 flex-col space-y-3 overflow-y-auto bg-[#161717] p-4">
              {messagesLoading ? (
                <div className="text-white">Loading messages...</div>
              ) : messagesError ? (
                <div className="text-red-500">Failed to load messages.</div>
              ) : sortedMessages.length === 0 ? (
                <div className="text-gray-400">No messages yet</div>
              ) : (
                sortedMessages.map((msg) => {
                  const isMe = msg.sender.id === me?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMe ? 'items-end' : 'items-start'
                      }`}
                    >
                      <span className="mb-1 text-xs text-gray-500">
                        {msg.sender.firstName} {msg.sender.lastName}
                      </span>
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 text-sm shadow ${
                          isMe
                            ? 'self-end bg-blue-500 text-white'
                            : 'self-start bg-gray-200 text-gray-900'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="mt-1 text-[11px] text-gray-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 🧩 Input */}
            <div className="flex items-center border-t border-gray-700 bg-[#1f1f1f] p-3">
              <input
                type="text"
                className="flex-1 rounded border border-gray-600 bg-[#2e2f2f] px-3 py-2 text-white focus:outline-none"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && messageInput.trim()) {
                    sendMessageMutation.mutate(messageInput.trim());
                  }
                }}
              />
              <button
                className="ml-3 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                onClick={() => {
                  if (messageInput.trim()) {
                    sendMessageMutation.mutate(messageInput.trim());
                  }
                }}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
