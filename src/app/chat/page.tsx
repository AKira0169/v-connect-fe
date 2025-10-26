'use client';

import { useEffect, useState, useRef } from 'react';
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
const fetchChats = async (): Promise<Chat[]> => {
  const { data } = await apiClient.get('/chats');
  // Your API returns { success, message, data, error }
  return data.data; // <- return only the array
};

const fetchMessages = async (chatId: string): Promise<Message[]> => {
  const { data } = await apiClient.get(`/messages/${chatId}`);
  return data.data || []; // safety fallback
};

export default function ChatPage() {
  const { socket, connected } = useSocket();
  const queryClient = useQueryClient();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 🟢 Fetch all chats
  const {
    data: chats = [],
    isLoading: chatsLoading,
    isError: chatsError,
  } = useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: fetchChats,
  });

  // 🟢 Fetch messages for selected chat
  const {
    data: messages = [],
    isLoading: messagesLoading,
    isError: messagesError,
  } = useQuery<Message[]>({
    queryKey: ['messages', selectedChatId],
    queryFn: () => fetchMessages(selectedChatId!),
    enabled: !!selectedChatId,
  });

  // 🟢 Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      socket?.emit('send_message', {
        receiverId: getReceiverId(selectedChatId!),
        content,
      });
    },
    onSuccess: () => setMessageInput(''),
  });

  // 🧠 Helper: get receiver ID from chat
  const getReceiverId = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return '';
    const me = localStorage.getItem('user_id');
    return chat.participants.find((p) => p.id !== me)?.id || '';
  };

  // 🧩 Listen to new messages from socket
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (message: Message) => {
      if (message.chatId === selectedChatId) {
        queryClient.setQueryData<Message[]>(
          ['messages', selectedChatId],
          (old = []) => [...old, message],
        );
      }

      queryClient.setQueryData<Chat[]>(['chats'], (old = []) =>
        old.map((chat) =>
          chat.id === message.chatId ? { ...chat, lastMessage: message } : chat,
        ),
      );
    });

    socket.on('message_sent', (message: Message) => {
      if (message.chatId === selectedChatId) {
        queryClient.setQueryData<Message[]>(
          ['messages', selectedChatId],
          (old = []) => [...old, message],
        );
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('message_sent');
    };
  }, [socket, selectedChatId]);

  // 🧹 Auto scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 🧩 Join chat room when selected
  useEffect(() => {
    if (socket && selectedChatId) {
      socket.emit('join_chat', { chatId: selectedChatId });
    }
  }, [socket, selectedChatId]);

  if (chatsLoading) return <div className="p-6">Loading chats...</div>;
  if (chatsError)
    return <div className="p-6 text-red-500">Failed to load chats.</div>;

  return (
    <div className="grid h-screen grid-cols-3">
      {/* 🟢 Chat List */}
      <div className="overflow-y-auto border-r border-gray-200">
        <h2 className="p-4 text-lg font-bold">Chats</h2>
        {chats.length === 0 ? (
          <div className="p-4 text-gray-500">No chats yet</div>
        ) : (
          chats.map((chat) => {
            const receiver = chat.participants.find(
              (p) => p.id !== localStorage.getItem('user_id'),
            );

            return (
              <div
                key={chat.id}
                className={`cursor-pointer p-4 hover:bg-gray-100 ${
                  chat.id === selectedChatId ? 'bg-gray-200' : ''
                }`}
                onClick={() => setSelectedChatId(chat.id)}
              >
                <div className="flex justify-between">
                  <div className="font-semibold">
                    {receiver?.firstName} {receiver?.lastName}
                  </div>
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <span className="rounded-full bg-blue-500 px-2 py-1 text-xs text-white">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                <div className="truncate text-sm text-gray-500">
                  {chat.lastMessage?.content || 'No messages yet'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 💬 Chat Window */}
      <div className="col-span-2 flex h-full flex-col">
        {!selectedChatId ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messagesLoading ? (
                <div>Loading messages...</div>
              ) : messagesError ? (
                <div className="text-red-500">Failed to load messages</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-500">No messages yet</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender.id === localStorage.getItem('user_id')
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        msg.sender.id === localStorage.getItem('user_id')
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-black'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex border-t p-4">
              <input
                type="text"
                className="mr-2 flex-1 rounded border px-3 py-2"
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
                className="rounded bg-blue-500 px-4 py-2 text-white"
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
