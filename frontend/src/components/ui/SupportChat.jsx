import React, { useState, useRef, useEffect } from 'react';
import './styles/SupportChat.css';

const SupportChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Здравствуйте! Чем могу помочь?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState('bot'); // 'bot' or 'live'
  const [showOperatorOffer, setShowOperatorOffer] = useState(false);
  const [isWaitingForOperator, setIsWaitingForOperator] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes("привет") || msg.includes("здравствуй") || msg.includes("добрый день")) {
      return "Привет! Рада вас видеть! Чем могу помочь? 😊";
    }
    else if (msg.includes("как создать пост") || msg.includes("создать пост")) {
      return "Чтобы создать пост:\n1. Перейдите во вкладку 'Посты'\n2. Нажмите кнопку '+ Создать пост'\n3. Заполните заголовок и содержание\n4. Нажмите 'Создать' ✨";
    }
    else if (msg.includes("как удалить пост") || msg.includes("удалить пост")) {
      return "Чтобы удалить пост:\n1. Найдите нужный пост во вкладке 'Посты'\n2. Нажмите кнопку 'Удалить' под постом\n3. Подтвердите удаление в диалоговом окне 🗑️";
    }
    else if (msg.includes("как редактировать пост") || msg.includes("изменить пост")) {
      return "Чтобы отредактировать пост:\n1. Перейдите к нужному посту\n2. Нажмите кнопку 'Редактировать'\n3. Измените заголовок или содержание\n4. Нажмите 'Обновить' ✏️";
    }
    else if (msg.includes("новости") || msg.includes("создать новость")) {
      return "Управление новостями:\n• Для создания нажмите '+ Создать новость'\n• Для редактирования - кнопка 'Редактировать'\n• Для удаления - кнопка 'Удалить'\nНовости могут содержать изображения! 📰";
    }
    else if (msg.includes("товары") || msg.includes("продукты") || msg.includes("добавить товар")) {
      return "Управление товарами:\n• Добавление: укажите название, цену, категорию\n• Редактирование: измените любые поля\n• Удаление: нажмите кнопку удаления\nТовары отображаются в виде карточек! 🛍️";
    }
    else if (msg.includes("пароль") || msg.includes("забыл пароль")) {
      return "Если вы забыли пароль:\n1. Нажмите 'Зарегистрироваться'\n2. Создайте новый аккаунт\n3. Обратитесь к администратору для восстановления старого 🔐";
    }
    else if (msg.includes("регистрация") || msg.includes("зарегистрироваться")) {
      return "Для регистрации:\n1. Нажмите 'Зарегистрироваться'\n2. Введите email, имя пользователя и пароль\n3. Подтвердите пароль\n4. Нажмите кнопку регистрации 📝";
    }
    else if (msg.includes("войти") || msg.includes("логин") || msg.includes("вход")) {
      return "Для входа:\n1. Введите email и пароль\n2. Нажмите кнопку 'Войти'\n3. Если забыли пароль, зарегистрируйтесь заново 🔑";
    }
    else if (msg.includes("профиль") || msg.includes("мои данные")) {
      return "Ваш профиль содержит:\n• ID пользователя\n• Email\n• Имя пользователя\nВсе данные отображаются в дашборде после входа 👤";
    }
    else if (msg.includes("помощь") || msg.includes("help") || msg.includes("что умеешь")) {
      return "Я могу помочь с:\n📝 Постами (создание, редактирование, удаление)\n📰 Новостями (управление контентом)\n🛍️ Товарами (добавление в каталог)\n🔐 Аккаунтом (вход, регистрация)\nЗадайте конкретный вопрос!";
    }
    else if (msg.includes("спасибо") || msg.includes("благодарю")) {
      return "Пожалуйста! Рада была помочь! Обращайтесь еще 🤗";
    }
    else if (msg.includes("пока") || msg.includes("до свидания")) {
      return "До свидания! Заходите еще! 👋";
    }
    else if (msg.includes("ошибка") || msg.includes("проблема")) {
      return "Извините за неудобства! Попробуйте:\n1. Обновить страницу\n2. Выйти и войти заново\n3. Проверить интернет-соединение\nЕсли проблема повторяется, напишите подробнее 🔧";
    }
    else {
      return "Спасибо за ваш вопрос! 👨‍💻 Наши специалисты рассмотрят его и ответят в ближайшее время. А пока вы можете:\n• Посмотреть FAQ\n• Задать вопрос иначе\n• Написать на support@example.com";
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: text,
      sender: "user",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    setIsTyping(true);
    
    setTimeout(() => {
      let botResponse;
      
      if (chatMode === 'live') {
        botResponse = "👩‍💼 Оператор: Спасибо за ваше сообщение! Я свяжусь с вами в ближайшее время.";
      } else {
        botResponse = getBotResponse(text);
        
        if (botResponse.includes('не понял') || botResponse.includes('переформулировать')) {
          setShowOperatorOffer(true);
        }
      }
      
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: chatMode === 'live' ? 'operator' : 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 500 + Math.random() * 500);
  };

  const handleSendMessage = async () => {
    await sendMessage(inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = async (question) => {
    await sendMessage(question);
    setInputMessage("");
  };

  const handleRequestOperator = () => {
    setChatMode('live');
    setShowOperatorOffer(false);
    setIsWaitingForOperator(true);
    
    setTimeout(() => {
      const operatorMessage = {
        id: Date.now(),
        text: "👩‍💼 Оператор подключен! Чем могу помочь?",
        sender: "operator",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, operatorMessage]);
      setIsWaitingForOperator(false);
    }, 1000);
  };

  const handleBackToBot = () => {
    setChatMode('bot');
    setShowOperatorOffer(false);
    setIsWaitingForOperator(false);
    
    const botMessage = {
      id: Date.now(),
      text: "🤖 Я вернулся! Чем еще могу помочь?",
      sender: "bot",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const quickQuestions = [
    "Как создать пост?",
    "Как редактировать пост?",
    "Управление товарами",
    "Помощь"
  ];

  const getHeaderInfo = () => {
    if (chatMode === 'live') {
      return {
        title: "Чат с оператором",
        status: isWaitingForOperator ? "⏳ Подключение..." : "🟢 Оператор онлайн",
        avatar: "👩‍💼",
        colorClass: "live-header"
      };
    }
    return {
      title: "Чат-бот поддержки",
      status: "Онлайн • Отвечаю мгновенно",
      avatar: "🤖",
      colorClass: ""
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <>
      <button 
        className={`chat-button ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
      >
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

          <div className={`chat-header ${headerInfo.colorClass}`}>
            <div className="chat-header-info">
              <div className="bot-avatar">{headerInfo.avatar}</div>
              <div>
                <h3>{headerInfo.title}</h3>
                <p>{headerInfo.status}</p>
              </div>
            </div>
            {chatMode === 'live' && (
              <button className="back-to-bot-btn" onClick={handleBackToBot}>
                🤖 Вернуться к боту
              </button>
            )}
            <button className="close-button" onClick={() => setIsOpen(false)}>
              ✖
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'user' ? 'user-message' : 
                           message.sender === 'operator' ? 'operator-message' : 'bot-message'}`}
              >
                {(message.sender === 'bot' || message.sender === 'operator') && (
                  <div className="message-avatar">
                    {message.sender === 'bot' ? '🤖' : '👩‍💼'}
                  </div>
                )}
                <div className="message-content">
                  {message.sender === 'operator' && <div className="message-sender">Оператор</div>}
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot-message">
                <div className="message-avatar">{chatMode === 'live' ? '👩‍💼' : '🤖'}</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {chatMode === 'bot' && (
            <div className="quick-questions">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          <div className="chat-input-container">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder={chatMode === 'live' ? "Введите сообщение для оператора..." : "Введите ваш вопрос..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="1"
            />
            <button 
              className="send-button"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
            >
              📤
            </button>
          </div>

          {chatMode === 'bot' && (
            <button className="request-operator-btn" onClick={handleRequestOperator}>
              👤 Связаться с оператором
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default SupportChat;