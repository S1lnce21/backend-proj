// frontend/src/types/chatTypes.ts

export type ChatMessageKind = 'user' | 'system' | 'bot' | 'operator';

export interface ChatMessage {
  kind: ChatMessageKind;
  id: string;
  room: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface ChatJoinPayload {
  room: string;
  nickname: string;
  userId?: number;
}