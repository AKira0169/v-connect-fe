import { User } from '@/api/auth.api';

// UI-friendly Chat type
export type ChatItem = {
  id: string;
  participants: User[]; // array of full User objects
  lastMessage?: { content: string } | null;
  unreadCount: number;
  isOnline: boolean;
};
