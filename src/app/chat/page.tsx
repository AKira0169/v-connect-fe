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

type ChatInsights = {
  summary: string;
  sentiment: string;
  keywords: string[];
};

type Chat = {
  id: string;
  participants?: User[];
  lastMessage?: Message;
  unreadCount?: number;
  aiInsights?: ChatInsights;
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
  const [insights, setInsights] = useState<ChatInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sock = connectSocket();
    setSocket(sock);
    return () => {
      disconnectSocket();
    };
  }, []);

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
        const chatList: Chat[] = Array.isArray(chatsRes.data.data)
          ? chatsRes.data.data
          : [];

        setChats(chatList);
      } catch (err) {
        console.error('❌ Failed to load user/chats', err);
      } finally {
        setLoadingChats(false);
      }
    };

    fetchUserAndChats();
  }, []);

  useEffect(() => {
    if (!socket || chats.length === 0) return;
    chats.forEach((c) => socket.emit('join_chat', { chatId: c.id }));
  }, [socket, chats]);

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
        setMessages(Array.isArray(res.data.data) ? res.data.data : []);
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
    setShowSidebar(false);
  }, [selectedChatId, socket]);

  // Sync insights when chats update
  useEffect(() => {
    if (!selectedChatId) return;
    const selectedChat = chats.find((c) => c.id === selectedChatId);
    if (selectedChat?.aiInsights) {
      setInsights(selectedChat.aiInsights);
    }
  }, [chats, selectedChatId]);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages((old) =>
        old.some((m) => m.id === message.id) ? old : [...old, message],
      );
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

  const getReceiverId = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat || !me) return '';
    return chat.participants?.find((p) => p.id !== me.id)?.id || '';
  };

  const handleSendMessage = () => {
    if (!selectedChatId || !me || !messageInput.trim()) return;
    const receiverId = getReceiverId(selectedChatId);
    if (!receiverId) return console.warn('No receiver found');
    socket?.emit('send_message', { receiverId, content: messageInput.trim() });
    setMessageInput('');
  };

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

  const handleStartChat = async (userId: string) => {
    try {
      const res = await apiClient.post(
        `/chats/direct/${userId}`,
        {},
        { withCredentials: true },
      );
      const chat = res.data;
      setChats((prev) =>
        prev.find((c) => c.id === chat.id) ? prev : [...prev, chat],
      );
      setSelectedChatId(chat.id);
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      console.error('❌ Failed to start chat', err);
    }
  };

  const fetchInsights = async () => {
    if (!selectedChatId) return;
    setLoadingInsights(true);
    try {
      const res = await apiClient.get(`/chats/${selectedChatId}/insights`, {
        withCredentials: true,
      });
      setInsights(res.data);
    } catch (err) {
      console.error('❌ Failed to load insights', err);
      setInsights(null);
    } finally {
      setLoadingInsights(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    const s = sentiment?.toLowerCase();
    if (s === 'positive') return 'text-green-400';
    if (s === 'negative') return 'text-red-400';
    return 'text-gray-400';
  };

  const getSentimentEmoji = (sentiment: string) => {
    const s = sentiment?.toLowerCase();
    if (s === 'positive') return '😊';
    if (s === 'negative') return '😟';
    return '😐';
  };

  if (loadingChats)
    return <div className="p-6 text-white">Loading chats...</div>;

  return (
    <div className="flex h-screen bg-[#161717]">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-30 w-full transform bg-[#161717] transition-transform duration-300 ease-in-out md:relative md:w-80 md:translate-x-0 lg:w-96`}
      >
        <div className="flex h-full flex-col border-r border-gray-700">
          <div className="flex items-center justify-between border-b border-gray-700 p-4">
            <h2 className="text-lg font-bold text-white">Chats</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="text-gray-400 hover:text-white md:hidden"
            >
              ✕
            </button>
          </div>

          <div className="px-4 py-3">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded bg-[#2e2f2f] px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
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
              chats.map((chat) => {
                const receiver = chat.participants?.find(
                  (p) => p.id !== me?.id,
                );
                if (!receiver) return null;

                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`cursor-pointer border-b border-gray-800 p-4 transition hover:bg-[#2e2f2f] ${
                      chat.id === selectedChatId ? 'bg-[#2e2f2f]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {receiver.firstName} {receiver.lastName}
                          </span>
                          {chat.unreadCount && chat.unreadCount > 0 && (
                            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm text-gray-400">
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                        {chat.aiInsights && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span
                                className={getSentimentColor(
                                  chat.aiInsights.sentiment,
                                )}
                              >
                                {getSentimentEmoji(chat.aiInsights.sentiment)}{' '}
                                {chat.aiInsights.sentiment}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-xs text-gray-500">
                              {chat.aiInsights.summary}
                            </p>
                            {chat.aiInsights.keywords &&
                              chat.aiInsights.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {chat.aiInsights.keywords
                                    .slice(0, 3)
                                    .map((keyword, idx) => (
                                      <span
                                        key={idx}
                                        className="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300"
                                      >
                                        {keyword}
                                      </span>
                                    ))}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {!selectedChatId ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="mb-2">
                Select a chat or search for a user to start messaging
              </p>
              <button
                onClick={() => setShowSidebar(true)}
                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 md:hidden"
              >
                Open Chats
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-700 bg-[#1f1f1f] px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="text-gray-400 hover:text-white md:hidden"
                >
                  ☰
                </button>
                <h2 className="text-base font-semibold text-white md:text-lg">
                  {chats
                    .find((c) => c.id === selectedChatId)
                    ?.participants?.find((p) => p.id !== me?.id)?.firstName ||
                    'Chat'}
                </h2>
              </div>
              <button
                onClick={fetchInsights}
                disabled={loadingInsights}
                className={`rounded px-3 py-1.5 text-xs font-medium text-white md:text-sm ${
                  loadingInsights
                    ? 'bg-gray-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {loadingInsights ? 'Analyzing...' : 'Get Insights'}
              </button>
            </div>

            {/* Insights Panel */}
            {insights && (
              <div className="border-b border-gray-700 bg-[#1f1f1f] px-4 py-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🧠</span>
                    <div className="flex-1">
                      <h3 className="mb-1 text-sm font-semibold text-white">
                        AI Insights
                      </h3>
                      <p className="text-xs text-gray-300 md:text-sm">
                        {insights.summary}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">Sentiment:</span>
                      <span
                        className={`font-medium ${getSentimentColor(insights.sentiment)}`}
                      >
                        {getSentimentEmoji(insights.sentiment)}{' '}
                        {insights.sentiment}
                      </span>
                    </div>
                    {insights.keywords && insights.keywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-gray-400">Keywords:</span>
                        {insights.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex flex-1 flex-col space-y-3 overflow-y-auto bg-[#161717] p-3 md:p-4">
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
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm shadow md:max-w-[70%] ${
                          isMe
                            ? 'self-end bg-blue-500 text-white'
                            : 'self-start bg-gray-200 text-gray-900'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="mt-1 text-[10px] text-gray-400 md:text-[11px]">
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

            {/* Input */}
            <div className="flex items-center gap-2 border-t border-gray-700 bg-[#1f1f1f] p-3">
              <input
                type="text"
                className="flex-1 rounded border border-gray-600 bg-[#2e2f2f] px-3 py-2 text-sm text-white focus:outline-none md:text-base"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && messageInput.trim())
                    handleSendMessage();
                }}
              />
              <button
                className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 md:px-4 md:text-base"
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
