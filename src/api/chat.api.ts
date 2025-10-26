import apiClient from '@/utils/apiClient';
import { handleApiError } from '@/utils/handleApiError';
import { ChatPreview } from '@/app/components/ChatList';

export async function getChat(): Promise<ChatPreview[]> {
  try {
    const res = await apiClient.get('chat');

    // The backend returns { data: [...], success: true }
    const chats = res.data.data;

    return chats as ChatPreview[];
  } catch (error) {
    console.error('❌ Error fetching chats:', error);
    handleApiError(error);
  }
}
