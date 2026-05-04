export interface ChatMessage {
  id: string;
  roomId: string;
  userId: number;
  username: string;
  message: string;
  timestamp: Date;
  isRead?: boolean;
  delivered?: boolean;
}

export interface ChatRoom {
  id: string;
  user1Id: number;
  user1Name: string;
  user2Id?: number;
  user2Name?: string;
  status: 'waiting' | 'active' | 'closed';
  messages: ChatMessage[];
  createdAt: Date;
}

export interface ChatUser {
  userId: number;
  username: string;
  socketId: string;
  isLooking: boolean;
  currentRoom?: string;
}

export interface FindPartnerData {
  userId: number;
  username: string;
}

export interface SendMessageData {
  roomId: string;
  message: string;
}

export interface MessageReadData {
  messageId: string;
  roomId: string;
}

export interface LeaveChatData {
  userId: number;
}