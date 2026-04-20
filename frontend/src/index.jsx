import React, { useState, useEffect } from 'react';
import BotChat from './BotChat';
import LiveChat from './LiveChat';
import { useChatSocket } from './hooks/useChatSocket';
import './SupportChat.css';

const SupportChat = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState('bot');
  const [showOperatorOffer, setShowOperatorOffer] = useState(false);

  const backendUrl = 'http://localhost:3000';
  
  const {
    messages,
    sendMessage,
    requestOperator,
    disconnect,
    status,
    error,
    hasOperator,
    isWaiting,
    waitingPosition,
    connect
  } = useChatSocket(backendUrl);

  useEffect(() => {
    if (isOpen && user) {
      connect({
        room: `support_${user.id}`,
        nickname: user.username,
        userId: user.id
      });
    }
  }, [isOpen, user, connect]);

  useEffect(() => {
    if (messages.length > 0 && chatMode === 'bot') {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.kind === 'bot' && 
          (lastMessage.text.includes('не понял') || 
           lastMessage.text.includes('переформулировать'))) {
        setShowOperatorOffer(true);
      }
    }
  }, [messages, chatMode]);

  const handleSendMessage = (message) => {
    sendMessage(message);
    setShowOperatorOffer(false);
  };

  const handleRequestOperator = () => {
    requestOperator();
    setChatMode('live');
    setShowOperatorOffer(false);
  };

  const handleLeaveChat = () => {
    disconnect();
    setChatMode('bot');
    setShowOperatorOffer(false);
    if (user) {
      connect({
        room: `support_${user.id}`,
        nickname: user.username,
        userId: user.id
      });
    }
  };

  return (
    <>
      <button className={`chat-button ${isOpen ? 'hidden' : ''}`} onClick={() => setIsOpen(true)}>
        <div className="chat-icon">💬</div>
        <span className="notification-badge">1</span>
      </button>

      {isOpen && (
        <div className="chat-modal">
          {showOperatorOffer && chatMode === 'bot' && (
            <div className="operator-offer">
              <p>🤔 Бот не смог помочь? Хотите перейти к живому оператору?</p>
              <div className="offer-buttons">
                <button className="accept-offer" onClick={handleRequestOperator}>
                  Да, перейти к оператору
                </button>
                <button className="decline-offer" onClick={() => setShowOperatorOffer(false)}>
                  Нет, остаться с ботом
                </button>
              </div>
            </div>
          )}

          {chatMode === 'bot' ? (
            <BotChat
              messages={messages}
              onSendMessage={handleSendMessage}
              onRequestOperator={handleRequestOperator}
            />
          ) : (
            <LiveChat
              messages={messages}
              onSendMessage={handleSendMessage}
              onLeaveChat={handleLeaveChat}
              isWaiting={isWaiting}
              waitingPosition={waitingPosition}
              hasOperator={hasOperator}
            />
          )}

          <button className="close-chat-btn" onClick={() => setIsOpen(false)}>
            ✖
          </button>
        </div>
      )}
    </>
  );
};

export default SupportChat;