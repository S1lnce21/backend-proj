import React, { useState, useRef, useEffect } from 'react';

const LiveChat = ({ messages, onSendMessage, onLeaveChat, isWaiting, waitingPosition, hasOperator }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputMessage.trim() && hasOperator) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && hasOperator) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageAvatar = (kind) => {
    switch(kind) {
      case 'operator': return '👩‍💼';
      case 'user': return '👤';
      case 'system': return 'ℹ️';
      default: return '🤖';
    }
  };

  return (
    <div className="chat-view">
      <div className="chat-header live-header">
        <div className="chat-header-info">
          <div className="bot-avatar">👥</div>
          <div>
            <h3>Чат с оператором</h3>
            <p>
              {hasOperator 
                ? '🟢 Оператор онлайн' 
                : isWaiting 
                  ? `⏳ Ожидание... позиция ${waitingPosition}` 
                  : '🔴 Поиск оператора...'}
            </p>
          </div>
        </div>
        <button className="leave-chat-btn" onClick={onLeaveChat}>
          ✖ Закрыть
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`message ${msg.kind === 'user' ? 'user-message' : msg.kind === 'operator' ? 'operator-message' : 'system-message'}`}
          >
            <div className="message-avatar">
              {getMessageAvatar(msg.kind)}
            </div>
            <div className="message-content">
              {(msg.kind === 'operator' || msg.kind === 'user') && (
                <div className="message-sender">{msg.author}</div>
              )}
              <div className="message-text">{msg.text}</div>
              <div className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder={hasOperator ? "Введите сообщение..." : "Ожидание подключения оператора..."}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          rows="1"
          disabled={!hasOperator}
        />
        <button 
          className="send-button" 
          onClick={handleSend} 
          disabled={!hasOperator || !inputMessage.trim()}
        >
          📤
        </button>
      </div>
    </div>
  );
};

export default LiveChat;