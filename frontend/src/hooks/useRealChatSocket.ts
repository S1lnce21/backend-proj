// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useRealChatSocket(backendUrl) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLooking, setIsLooking] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [inChat, setInChat] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [partnerName, setPartnerName] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const connect = useCallback((userId, username) => {
    const socket = io(backendUrl, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      socket.emit('chat:find-partner', { userId, username });
      setIsLooking(true);
    });

    socket.on('chat:waiting', () => {
      setIsWaiting(true);
      setIsLooking(false);
    });

    socket.on('chat:matched', (data) => {
      setRoomId(data.roomId);
      setPartnerName(data.partnerName);
      setInChat(true);
      setIsWaiting(false);
      setIsLooking(false);
      
      setMessages((prev) => [...prev, {
        id: Date.now(),
        roomId: data.roomId,
        userId: 0,
        username: 'Система',
        message: `👋 Вы подключились к чату с ${data.partnerName}!`,
        timestamp: new Date()
      }]);
    });

    socket.on('chat:history', (history) => {
      setMessages(history);
    });

    socket.on('chat:message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('chat:partner-left', () => {
      setMessages((prev) => [...prev, {
        id: Date.now(),
        roomId: roomId || '',
        userId: 0,
        username: 'Система',
        message: '😔 Собеседник покинул чат',
        timestamp: new Date()
      }]);
      setInChat(false);
      setRoomId(null);
      setPartnerName(null);
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
    });

    return socket;
  }, [backendUrl]);

  const sendMessage = useCallback((message) => {
    if (socketRef.current && roomId && message.trim()) {
      socketRef.current.emit('chat:send-message', { roomId, message });
    }
  }, [roomId]);

  const leaveChat = useCallback((userId) => {
    if (socketRef.current) {
      socketRef.current.emit('chat:leave', { userId });
      setInChat(false);
      setRoomId(null);
      setPartnerName(null);
      setMessages([]);
    }
  }, []);

  const stopLooking = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('chat:stop-looking');
      setIsLooking(false);
      setIsWaiting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsLooking(false);
    setIsWaiting(false);
    setInChat(false);
    setMessages([]);
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    isConnected,
    isLooking,
    isWaiting,
    inChat,
    partnerName,
    messages,
    error,
    connect,
    sendMessage,
    leaveChat,
    stopLooking,
    disconnect
  };
}