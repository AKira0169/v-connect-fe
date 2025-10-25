import apiClient from '@/utils/apiClient';
import { handleApiError } from '@/utils/handleApiError';
import { ChatItem } from '../types/Chat';

export async function getChat(): Promise<ChatItem[]> {
  try {
    const res = await apiClient.get('chat');
    return res.data.data as ChatItem[];
  } catch (error) {
    handleApiError(error);
  }
}
