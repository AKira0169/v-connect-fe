import { User } from '../api/auth.api';
import { MessageStatus } from '@/types/MessageStatus';
import { ChatItem } from './Chat';

export type Message = {
  id: string;

  chat: ChatItem;

  sender: User;

  receiver: User;

  content: string;

  status: MessageStatus;

  createdAt: Date;
  updatedAt: Date;
};
