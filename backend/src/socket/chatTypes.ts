export interface ChatMessage {
  id: string;
  roomId: string;
  userId: number;
  username: string;
  message: string;
  timestamp: Date;
}

export interface ChatRoom {
  id: string;
  user1Id: number;
  user1Name: string;
  user2Id?: number;
  user2Name?: string;
  status: string;
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