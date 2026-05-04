import { Server, Socket } from 'socket.io';
import { chatService } from './chatService';
import { FindPartnerData, SendMessageData, MessageReadData, LeaveChatData } from './chatTypes';

export const setupChatSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('🟢 Пользователь подключился:', socket.id);
    let currentUserId: number | null = null;

    socket.on('find-partner', (data: FindPartnerData) => {
      const { userId, username } = data;
      currentUserId = userId;
      
      console.log(`🔍 Пользователь ${username} (${userId}) ищет собеседника`);
      
      chatService.addWaitingUser(userId, username, socket.id);
      const partner = chatService.findPartner(userId);
      
      if (partner) {
        const currentUser = chatService.getUser(userId);
        if (currentUser) {
          const roomId = chatService.createRoom(currentUser, partner);
          
          socket.join(roomId);
          const partnerSocket = io.sockets.sockets.get(partner.socketId);
          if (partnerSocket) {
            partnerSocket.join(roomId);
          }
          
          socket.emit('matched', { roomId, partnerName: partner.username });
          partnerSocket?.emit('matched', { roomId, partnerName: username });
          
          const history = chatService.getRoomHistory(roomId);
          socket.emit('history', history);
          partnerSocket?.emit('history', history);
          
          console.log(`✅ Чат создан между ${username} и ${partner.username}`);
        }
      } else {
        socket.emit('waiting');
        console.log(`⏳ ${username} в очереди ожидания`);
      }
    });

    socket.on('send-message', (data: SendMessageData) => {
      const { roomId, message } = data;
      
      const user = chatService.getUser(currentUserId!);
      if (!user) return;
      
      const newMessage = chatService.addMessage(roomId, currentUserId!, user.username, message);
      if (newMessage) {
        io.to(roomId).emit('new-message', newMessage);
        
        const partner = chatService.getPartnerInRoom(roomId, currentUserId!);
        if (partner) {
          const partnerSocket = io.sockets.sockets.get(partner.socketId);
          if (partnerSocket) {
            partnerSocket.emit('message-delivered', { messageId: newMessage.id });
          }
        }
        
        console.log(`💬 ${user.username}: ${message}`);
      }
    });

    socket.on('message-read', (data: MessageReadData) => {
      const { messageId, roomId } = data;
      const user = chatService.getUser(currentUserId!);
      if (!user) return;
      
      const partner = chatService.getPartnerInRoom(roomId, currentUserId!);
      if (partner) {
        const partnerSocket = io.sockets.sockets.get(partner.socketId);
        if (partnerSocket) {
          partnerSocket.emit('message-read', { messageId });
        }
      }
    });

    socket.on('leave-chat', (data: LeaveChatData) => {
      const { userId } = data;
      const room = chatService.getUserRoom(userId);
      
      if (room) {
        const partner = chatService.getPartnerInRoom(room.id, userId);
        if (partner) {
          const partnerSocket = io.sockets.sockets.get(partner.socketId);
          partnerSocket?.emit('partner-left');
        }
        socket.leave(room.id);
      }
      
      chatService.removeUser(userId);
      console.log(`🔴 Пользователь ${userId} покинул чат`);
    });

    socket.on('stop-looking', () => {
      if (currentUserId) {
        chatService.removeWaitingUser(currentUserId);
        console.log(`⏹️ Пользователь ${currentUserId} остановил поиск`);
      }
    });

    socket.on('disconnect', () => {
      if (currentUserId) {
        const room = chatService.getUserRoom(currentUserId);
        if (room) {
          const partner = chatService.getPartnerInRoom(room.id, currentUserId);
          if (partner) {
            const partnerSocket = io.sockets.sockets.get(partner.socketId);
            partnerSocket?.emit('partner-left');
          }
        }
        chatService.removeUser(currentUserId);
        console.log(`🔴 Пользователь ${currentUserId} отключился`);
      }
    });
  });
};