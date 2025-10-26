'use client';
import { getChat } from '@/api/chat.api';
import { useQuery } from '@tanstack/react-query';
import { ChatPreview } from '../components/ChatList';

export function useGetChat() {
  const { data, isError, error, isPending } = useQuery<ChatPreview[]>({
    queryKey: ['chats'],
    queryFn: getChat,
  });

  return { chats: data, isError, error, isPending };
}
