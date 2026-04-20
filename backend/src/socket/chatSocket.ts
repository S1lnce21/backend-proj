import { Server, Socket } from 'socket.io';
import { chatService } from './chatService';

export function setupChatSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('🟢 Пользователь подключился к сокету:', socket.id);
    let currentUserId: number | null = null;

    socket.on('find-partner', (data: { userId: number; username: string }) => {
      const { userId, username } = data;
      currentUserId = userId;
      
      console.log(`🔍 ${username} (${userId}) ищет собеседника`);
      
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
          
          console.log(`✅ Чат создан: ${username} и ${partner.username} (комната: ${roomId})`);
        }
      } else {
        socket.emit('waiting');
        console.log(`⏳ ${username} в очереди ожидания`);
      }
    });

    socket.on('send-message', (data: { roomId: string; message: string }) => {
      const { roomId, message } = data;
      
      const user = chatService.getUser(currentUserId!);
      if (!user) return;
      
      const newMessage = chatService.addMessage(roomId, currentUserId!, user.username, message);
      if (newMessage) {
        io.to(roomId).emit('new-message', newMessage);
        console.log(`💬 ${user.username}: ${message}`);
      }
    });

    socket.on('leave-chat', (data: { userId: number }) => {
      const { userId } = data;
      console.log(`👋 Пользователь ${userId} покидает чат`);
      
      const room = chatService.getUserRoom(userId);
      if (room) {
        const partner = chatService.getPartnerInRoom(room.id, userId);
        if (partner) {
          const partnerSocket = io.sockets.sockets.get(partner.socketId);
          if (partnerSocket) {
            partnerSocket.emit('partner-left');
            console.log(`📤 Уведомление отправлено партнеру ${partner.username}`);
          }
        }
        socket.leave(room.id);
      }
      
      chatService.removeUser(userId);
    });

    socket.on('stop-looking', () => {
      if (currentUserId) {
        console.log(`⏹️ Пользователь ${currentUserId} остановил поиск`);
        chatService.removeWaitingUser(currentUserId);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔴 Пользователь отключился от сокета:', socket.id);
      if (currentUserId) {
        const room = chatService.getUserRoom(currentUserId);
        if (room) {
          const partner = chatService.getPartnerInRoom(room.id, currentUserId);
          if (partner) {
            const partnerSocket = io.sockets.sockets.get(partner.socketId);
            if (partnerSocket && partnerSocket.connected) {
              partnerSocket.emit('partner-left');
              console.log(`📤 Уведомление отправлено партнеру ${partner.username}`);
            }
          }
        }
        chatService.removeUser(currentUserId);
      }
    });
  });
}