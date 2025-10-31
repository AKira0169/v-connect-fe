'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import apiClient from '@/utils/apiClient';
import { connectSocket, disconnectSocket } from '../socket';
import type { Socket } from 'socket.io-client';

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
  participants?: User[];
  lastMessage?: Message;
  unreadCount?: number;
};

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 🟢 Connect socket
  useEffect(() => {
    const sock = connectSocket();
    setSocket(sock);
    return () => {
      disconnectSocket();
    };
  }, []);

  // 🧩 Fetch user + chats
  useEffect(() => {
    const fetchUserAndChats = async () => {
      try {
        const userRes = await apiClient.get('/user/me', {
          withCredentials: true,
        });
        setMe(userRes.data.data);

        const chatsRes = await apiClient.get('/chats', {
          withCredentials: true,
        });
        const data = chatsRes.data.data;
        setChats(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('❌ Failed to load user/chats', err);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchUserAndChats();
  }, []);

  // 🧩 Auto-join all chats
  useEffect(() => {
    if (!socket || !Array.isArray(chats) || chats.length === 0) return;
    chats.forEach((c) => socket.emit('join_chat', { chatId: c.id }));
  }, [socket, chats]);

  // 🧩 Fetch messages on chat select
  useEffect(() => {
    if (!selectedChatId || !socket) return;

    socket.emit('join_chat', { chatId: selectedChatId });
    socket.emit('mark_read', { chatId: selectedChatId });

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await apiClient.get(`/messages/${selectedChatId}`, {
          withCredentials: true,
        });
        const msgs = res.data.data;
        setMessages(Array.isArray(msgs) ? msgs : []);
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }),
          50,
        );
      } catch (err) {
        console.error('❌ Failed to load messages', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedChatId, socket]);

  // ✅ Sort messages oldest → newest
  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  // 🧩 Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages((old) => {
        if (old.some((m) => m.id === message.id)) return old;
        return [...old, message];
      });

      setChats((old) =>
        old.map((chat) =>
          chat.id === message.chatId ? { ...chat, lastMessage: message } : chat,
        ),
      );

      if (message.chatId === selectedChatId)
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }),
          50,
        );
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, selectedChatId]);

  // 🧩 Listen for messages_read
  useEffect(() => {
    if (!socket || !me) return;

    const handleMessagesRead = ({
      chatId,
      userId,
    }: {
      chatId: string;
      userId: string;
    }) => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                unreadCount: userId === me.id ? 0 : (chat.unreadCount ?? 0),
              }
            : chat,
        ),
      );
    };

    socket.on('messages_read', handleMessagesRead);
    return () => {
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, me]);

  // ✅ Get receiver ID
  const getReceiverId = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat || !me) return '';
    return chat.participants?.find?.((p) => p.id !== me.id)?.id || '';
  };

  // 🧩 Send message
  const handleSendMessage = () => {
    if (!selectedChatId || !me || !messageInput.trim()) return;
    const receiverId = getReceiverId(selectedChatId);
    if (!receiverId) return console.warn('No receiver found');
    socket?.emit('send_message', { receiverId, content: messageInput.trim() });
    setMessageInput('');
  };

  // 🔍 Search users
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await apiClient.get(`/user/search?query=${searchTerm}`, {
          withCredentials: true,
        });
        setSearchResults(res.data.data);
      } catch (err) {
        console.error('❌ User search failed', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // 🧩 Start chat with user
  const handleStartChat = async (userId: string) => {
    try {
      // ✅ FIXED: use {} instead of null
      const res = await apiClient.post(
        `/chats/direct/${userId}`,
        {},
        {
          withCredentials: true,
        },
      );
      const chat = res.data;

      setChats((prev) => {
        const exists = prev.find((c) => c.id === chat.id);
        return exists ? prev : [...prev, chat];
      });

      setSelectedChatId(chat.id);
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      console.error('❌ Failed to start chat', err);
    }
  };

  const filteredChats = useMemo(() => {
    if (searchTerm.trim()) return chats;
    return chats;
  }, [searchTerm, chats]);

  if (loadingChats)
    return <div className="p-6 text-white">Loading chats...</div>;

  return (
    <div className="grid h-screen grid-cols-3 bg-[#161717]">
      {/* 🟢 Chat List */}
      <div className="h-full overflow-y-auto border-r border-gray-700">
        <h2 className="p-4 text-lg font-bold text-white">Chats</h2>

        {/* 🔍 Search Bar */}
        <div className="px-4 pb-3">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded bg-[#2e2f2f] px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* 🧩 Search Results */}
        {searchTerm.trim() ? (
          <div>
            {searching ? (
              <div className="p-4 text-gray-400">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-gray-400">No users found</div>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleStartChat(user.id)}
                  className="cursor-pointer p-4 transition hover:bg-[#2e2f2f]"
                >
                  <span className="font-semibold text-white">
                    {user.firstName} {user.lastName}
                  </span>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const receiver = chat.participants?.find?.((p) => p.id !== me?.id);
            if (!receiver) return null;

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
                    {receiver.firstName} {receiver.lastName}
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
            Select a chat or search for a user to start messaging
          </div>
        ) : (
          <>
            {/* 🧩 Messages */}
            <div className="flex flex-1 flex-col space-y-3 overflow-y-auto bg-[#161717] p-4">
              {loadingMessages ? (
                <div className="text-white">Loading messages...</div>
              ) : sortedMessages.length === 0 ? (
                <div className="text-gray-400">No messages yet</div>
              ) : (
                sortedMessages.map((msg) => {
                  const isMe = msg.sender.id === me?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
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
                  if (e.key === 'Enter' && messageInput.trim())
                    handleSendMessage();
                }}
              />
              <button
                className="ml-3 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                onClick={handleSendMessage}
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
