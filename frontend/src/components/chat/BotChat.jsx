import React, { useState, useRef, useEffect } from 'react';

const BotChat = ({ messages, onSendMessage, onRequestOperator }) => {
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
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "Как создать пост?",
    "Как редактировать пост?",
    "Управление товарами",
    "Помощь"
  ];

  const getMessageAvatar = (kind) => {
    switch(kind) {
      case 'bot': return '🤖';
      case 'user': return '👤';
      case 'system': return 'ℹ️';
      default: return '💬';
    }
  };

  return (
    <div className="chat-view">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="bot-avatar">🤖</div>
          <div>
            <h3>Чат-бот поддержки</h3>
            <p>Онлайн • Отвечаю мгновенно</p>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.kind === 'user' ? 'user-message' : 'bot-message'}`}>
            <div className="message-avatar">
              {getMessageAvatar(msg.kind)}
            </div>
            <div className="message-content">
              {msg.kind === 'bot' && <div className="message-sender">Чат-Бот</div>}
              <div className="message-text">{msg.text}</div>
              <div className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="quick-questions">
        {quickQuestions.map((question, idx) => (
          <button key={idx} className="quick-question-btn" onClick={() => onSendMessage(question)}>
            {question}
          </button>
        ))}
      </div>

      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Введите ваш вопрос..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          rows="1"
        />
        <button className="send-button" onClick={handleSend}>
          📤
        </button>
      </div>

      <button className="request-operator-btn" onClick={onRequestOperator}>
        👤 Связаться с оператором
      </button>
    </div>
  );
};

export default BotChat;