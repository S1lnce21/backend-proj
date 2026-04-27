import { Server } from 'socket.io';

interface WebSocketEvent {
  type: 'post_created' | 'post_updated' | 'post_deleted' | 'news_created' | 'news_updated' | 'news_deleted' | 'product_created' | 'product_updated' | 'product_deleted';
  userId: number;
  data: any;
  timestamp: Date;
}

export function setupWebSocket(io: Server) {
  const emitToAll = (event: string, data: any) => {
    io.emit(event, data);
    console.log(`📡 WebSocket событие "${event}" отправлено всем`);
  };

  const emitToUser = (userId: number, event: string, data: any) => {
    io.to(`user_${userId}`).emit(event, data);
    console.log(`📡 WebSocket событие "${event}" отправлено пользователю ${userId}`);
  };

  const emitToRoom = (roomId: string, event: string, data: any) => {
    io.to(roomId).emit(event, data);
    console.log(`📡 WebSocket событие "${event}" отправлено в комнату ${roomId}`);
  };

  io.on('connection', (socket) => {
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
      console.log('🏓 Получен ping, отправлен pong');
    });

    socket.on('subscribe', (event: string) => {
      socket.join(`event_${event}`);
      console.log(`📡 Сокет ${socket.id} подписался на событие ${event}`);
    });

    socket.on('unsubscribe', (event: string) => {
      socket.leave(`event_${event}`);
      console.log(`📡 Сокет ${socket.id} отписался от события ${event}`);
    });
  });

  return { emitToAll, emitToUser, emitToRoom };
}