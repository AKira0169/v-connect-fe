'use client';
import { getChat } from '@/api/chat.api';
import { useQuery } from '@tanstack/react-query';

export function useGetChat() {
  const { data, isError, error, isPending } = useQuery({
    queryKey: ['chats'],
    queryFn: getChat,
  });

  return { chats: data, isError, error, isPending };
}
