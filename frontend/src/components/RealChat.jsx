import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import './styles/RealChat.css';

const RealChat = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isLooking, setIsLooking] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [inChat, setInChat] = useState(false);
  const [partnerName, setPartnerName] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findPartner = () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      setError(null);
      newSocket.emit('find-partner', { userId: user.id, username: user.username });
      setIsLooking(true);
      setIsConnecting(false);
    });

    newSocket.on('waiting', () => {
      console.log('⏳ Waiting for partner...');
      setIsWaiting(true);
      setIsLooking(false);
    });

    newSocket.on('matched', (data) => {
      console.log('🎉 Matched with:', data.partnerName);
      setPartnerName(data.partnerName);
      setInChat(true);
      setIsWaiting(false);
      setIsLooking(false);
      setMessages([]);
    });

    newSocket.on('history', (history) => {
      console.log('📜 History loaded:', history.length);
      setMessages(history);
    });

    newSocket.on('new-message', (message) => {
      console.log('💬 New message:', message);
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('partner-left', () => {
      console.log('👋 Partner left');
      setInChat(false);
      setPartnerName(null);
      setMessages(prev => [...prev, {
        id: Date.now(),
        message: 'Собеседник покинул чат',
        username: 'Система',
        timestamp: new Date()
      }]);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message);
      setError(`Ошибка подключения: ${err.message}. Убедитесь, что сервер запущен на порту 3000`);
      setIsLooking(false);
      setIsWaiting(false);
      setIsConnecting(false);
      newSocket.disconnect();
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
      if (reason === 'io server disconnect') {
        setError('Сервер отключился. Перезагрузите страницу.');
      }
    });

    setSocket(newSocket);
  };

  const sendMessage = () => {
    if (socket && inputMessage.trim() && inChat) {
      socket.emit('send-message', { message: inputMessage });
      setInputMessage('');
    }
  };

  const leaveChat = () => {
    if (socket) {
      socket.emit('leave-chat', { userId: user.id });
      socket.disconnect();
      setSocket(null);
      setInChat(false);
      setPartnerName(null);
      setMessages([]);
      setIsLooking(false);
      setIsWaiting(false);
      setIsConnecting(false);
      setError(null);
    }
  };

  const stopLooking = () => {
    if (socket) {
      socket.emit('stop-looking');
      socket.disconnect();
      setSocket(null);
      setIsLooking(false);
      setIsWaiting(false);
      setIsConnecting(false);
      setError(null);
    }
  };

  const getStatusText = () => {
    if (inChat) return `🟢 В чате с ${partnerName}`;
    if (isConnecting) return '🟡 Подключение...';
    if (isLooking) return '🔍 Поиск собеседника...';
    if (isWaiting) return '⏳ Ожидание собеседника...';
    return '⚫ Не подключен';
  };

  return (
    <>
      <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
        💬
      </button>

      {isOpen && (
        <div className="chat-modal">
          <div className="chat-header">
            <div>
              <h3>Чат с собеседником</h3>
              <p className="chat-status">{getStatusText()}</p>
            </div>
            <button className="close-chat-btn" onClick={() => setIsOpen(false)}>
              ✖
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && !inChat && !isLooking && !isWaiting && !isConnecting && (
              <div className="chat-empty">
                <p>👋 Нажмите "Найти собеседника" чтобы начать общение</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`message ${msg.userId === user?.id ? 'message-user' : 'message-partner'}`}
              >
                <div className="message-bubble">
                  {msg.username !== 'Система' && msg.userId !== user?.id && (
                    <div className="message-sender">{msg.username}</div>
                  )}
                  <div className="message-text">{msg.message}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-controls">
            {!socket && !inChat && !isConnecting && (
              <button className="chat-btn-primary" onClick={findPartner}>
                🔍 Найти собеседника
              </button>
            )}
            
            {(isConnecting || isLooking || isWaiting) && !inChat && (
              <button className="chat-btn-danger" onClick={stopLooking}>
                ⏹️ {isConnecting ? 'Отмена' : 'Остановить поиск'}
              </button>
            )}
            
            {inChat && (
              <>
                <div className="chat-input-area">
                  <input
                    type="text"
                    className="chat-input"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Введите сообщение..."
                  />
                  <button className="chat-send-btn" onClick={sendMessage}>
                    📤
                  </button>
                </div>
                <button className="chat-leave-btn" onClick={leaveChat}>
                  🚪 Покинуть чат
                </button>
              </>
            )}
          </div>
          
          {error && (
            <div className="chat-error">
              ⚠️ {error}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default RealChat;