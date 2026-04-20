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
  const [roomId, setRoomId] = useState(null);
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

  const resetChatState = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setInChat(false);
    setPartnerName(null);
    setRoomId(null);
    setIsLooking(false);
    setIsWaiting(false);
    setIsConnecting(false);
    setError(null);
  };

  const findPartner = () => {
    if (inChat || isLooking || isWaiting || isConnecting) {
      return;
    }
    
    resetChatState();
    setIsConnecting(true);
    setError(null);
    
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    newSocket.on('connect', () => {
      setError(null);
      newSocket.emit('find-partner', { userId: user.id, username: user.username });
      setIsLooking(true);
      setIsConnecting(false);
    });

    newSocket.on('waiting', () => {
      setIsWaiting(true);
      setIsLooking(false);
    });

    newSocket.on('matched', (data) => {
      setRoomId(data.roomId);
      setPartnerName(data.partnerName);
      setInChat(true);
      setIsWaiting(false);
      setIsLooking(false);
      setMessages([]);
      
      const toast = document.createElement('div');
      toast.className = 'toast-notification toast-success';
      toast.innerHTML = `
        <div class="toast-icon">👥</div>
        <div class="toast-content">
          <div class="toast-title">Новый собеседник!</div>
          <div class="toast-message">${data.partnerName} присоединился к чату</div>
        </div>
        <button class="toast-close">×</button>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 100);
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.onclick = () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      };
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    });

    newSocket.on('history', (history) => {
      setMessages(history);
    });

    newSocket.on('new-message', (message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    newSocket.on('partner-left', () => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        message: 'Собеседник покинул чат. Нажмите кнопку для нового поиска.',
        username: 'Система',
        timestamp: new Date(),
        userId: 0
      }]);
      setInChat(false);
      setPartnerName(null);
      setRoomId(null);
      setIsLooking(false);
      setIsWaiting(false);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    });

    newSocket.on('connect_error', (err) => {
      setError(`Ошибка: ${err.message}`);
      setIsLooking(false);
      setIsWaiting(false);
      setIsConnecting(false);
      newSocket.disconnect();
      setSocket(null);
    });

    newSocket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        setError('Сервер отключился');
        resetChatState();
      }
    });

    setSocket(newSocket);
  };

  const sendMessage = () => {
    if (!socket || !roomId || !inputMessage.trim() || !inChat) {
      return;
    }
    socket.emit('send-message', { roomId, message: inputMessage });
    setInputMessage('');
  };

  const leaveChat = () => {
    if (socket && roomId) {
      socket.emit('leave-chat', { userId: user.id });
    }
    resetChatState();
  };

  const stopLooking = () => {
    if (socket) {
      socket.emit('stop-looking');
      socket.disconnect();
    }
    resetChatState();
  };

  const getStatusText = () => {
    if (inChat) return `🟢 В чате с ${partnerName}`;
    if (isConnecting) return '🟡 Подключение...';
    if (isLooking) return '🔍 Поиск собеседника...';
    if (isWaiting) return '⏳ Ожидание собеседника...';
    return '⚫ Не подключен';
  };

  const showMainButton = !inChat && !isLooking && !isWaiting && !isConnecting;
  const showStopButton = (isConnecting || isLooking || isWaiting) && !inChat;

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
                <p>👋 Нажмите кнопку чтобы начать общение</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
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
            {showMainButton && (
              <button className="chat-btn-primary" onClick={findPartner}>
                🔍 Найти собеседника
              </button>
            )}
            
            {showStopButton && (
              <button className="chat-btn-danger" onClick={stopLooking}>
                ⏹️ Остановить поиск
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