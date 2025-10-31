import apiClient from '@/utils/apiClient';
import { handleApiError } from '@/utils/handleApiError';

export async function getChat() {
  try {
    const res = await apiClient.get('chat');

    // The backend returns { data: [...], success: true }
    const chats = res.data.data;

    return chats;
  } catch (error) {
    console.error('❌ Error fetching chats:', error);
    handleApiError(error);
  }
}
