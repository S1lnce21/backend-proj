export type ChatMessageKind = 'user' | 'system' | 'bot' | 'operator';

export type ChatRoomName = string;
export type ChatNickname = string;

export interface ChatMessage {
  kind: ChatMessageKind;
  id: string;
  room: ChatRoomName;
  author: ChatNickname;
  text: string;
  createdAt: number;
}

export interface ChatJoinPayload {
  room: ChatRoomName;
  nickname: ChatNickname;
  userId?: number;
}

export interface ChatJoinAckOk {
  ok: true;
}

export interface ChatJoinAckError {
  ok: false;
  error: string;
}

export type ChatJoinAck = ChatJoinAckOk | ChatJoinAckError;

export interface ChatSendPayload {
  room: ChatRoomName;
  text: string;
}

export interface ChatSendAckOk {
  ok: true;
}

export interface ChatSendAckError {
  ok: false;
  error: string;
}

export type ChatSendAck = ChatSendAckOk | ChatSendAckError;

export interface SocketChatData {
  room?: ChatRoomName;
  nickname?: ChatNickname;
  userId?: number;
}

export const DEFAULT_ROOM = 'support';
export const OPERATOR_ROOM = 'operators';