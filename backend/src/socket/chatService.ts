import { ChatRoom, ChatMessage, ChatUser } from './chatTypes';

class ChatService {
  private users: Map<number, ChatUser> = new Map();
  private waitingUsers: ChatUser[] = [];
  private rooms: Map<string, ChatRoom> = new Map();

  addWaitingUser(userId: number, username: string, socketId: string): void {
    const user: ChatUser = {
      userId,
      username,
      socketId,
      isLooking: true
    };
    this.users.set(userId, user);
    this.waitingUsers.push(user);
  }

  removeWaitingUser(userId: number): void {
    this.waitingUsers = this.waitingUsers.filter(u => u.userId !== userId);
    const user = this.users.get(userId);
    if (user) {
      user.isLooking = false;
    }
  }

  findPartner(userId: number): ChatUser | null {
    const partner = this.waitingUsers.find(u => u.userId !== userId);
    if (partner) {
      this.removeWaitingUser(userId);
      this.removeWaitingUser(partner.userId);
      return partner;
    }
    return null;
  }

  createRoom(user1: ChatUser, user2: ChatUser): string {
    const roomId = `room_${Date.now()}_${user1.userId}_${user2.userId}`;
    const room: ChatRoom = {
      id: roomId,
      user1Id: user1.userId,
      user1Name: user1.username,
      user2Id: user2.userId,
      user2Name: user2.username,
      status: 'active',
      messages: [],
      createdAt: new Date()
    };
    
    this.rooms.set(roomId, room);
    
    const u1 = this.users.get(user1.userId);
    const u2 = this.users.get(user2.userId);
    if (u1) {
      u1.currentRoom = roomId;
      u1.isLooking = false;
    }
    if (u2) {
      u2.currentRoom = roomId;
      u2.isLooking = false;
    }
    
    return roomId;
  }

  addMessage(roomId: string, userId: number, username: string, message: string): ChatMessage | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      roomId,
      userId,
      username,
      message,
      timestamp: new Date()
    };
    
    room.messages.push(newMessage);
    return newMessage;
  }

  getRoomHistory(roomId: string): ChatMessage[] {
    const room = this.rooms.get(roomId);
    return room ? room.messages : [];
  }

  getRoom(roomId: string): ChatRoom | undefined {
    return this.rooms.get(roomId);
  }

  getUserRoom(userId: number): ChatRoom | undefined {
    const user = this.users.get(userId);
    if (!user || !user.currentRoom) return undefined;
    return this.rooms.get(user.currentRoom);
  }

  getPartnerInRoom(roomId: string, userId: number): ChatUser | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    const partnerId = room.user1Id === userId ? room.user2Id : room.user1Id;
    if (!partnerId) return null;
    
    return this.users.get(partnerId) || null;
  }

  getUser(userId: number): ChatUser | undefined {
    return this.users.get(userId);
  }

  removeUser(userId: number): void {
    const user = this.users.get(userId);
    if (user && user.currentRoom) {
      this.rooms.delete(user.currentRoom);
    }
    this.removeWaitingUser(userId);
    this.users.delete(userId);
  }
}

export const chatService = new ChatService();