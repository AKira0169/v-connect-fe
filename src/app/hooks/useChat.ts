'use client';

import { getChat } from '@/api/chat.api';
import { ChatItem } from '@/types/Chat';
import { useQuery } from '@tanstack/react-query';

export function useGetChat() {
  const { data, isError, error, isPending } = useQuery<ChatItem[]>({
    queryKey: ['chats'],
    queryFn: getChat,
  });

  return { chats: data, isError, error, isPending };
}
