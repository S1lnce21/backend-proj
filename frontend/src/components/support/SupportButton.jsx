import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { ticketsAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';
import '../styles/SupportButton.css';

let socket = null;

const SupportButton = ({ user }) => {
  const { t, theme } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [archivedTickets, setArchivedTickets] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const isStaff = user?.role === 'admin' || user?.role === 'moderator';

  useEffect(() => {
    if (!user) return;
    
    fetchTickets();
    
    if (!socket) {
      socket = io('http://localhost:3000');
      socket.emit('join-user', user?.id);
      
      socket.on('new_ticket', (ticket) => {
        if (isStaff || ticket.userId === user?.id) {
          if (ticket.status !== 'archived') {
            setTickets(prev => [ticket, ...prev]);
          } else if (isStaff) {
            setArchivedTickets(prev => [ticket, ...prev]);
          }
        }
      });
      
      socket.on('ticket_message', ({ ticketId, message }) => {
        if (selectedTicket?.id === ticketId) {
          setMessages(prev => [...prev, message]);
        }
        const updateTickets = (prev) => prev.map(t => 
          t.id === ticketId 
            ? { ...t, messages: [...(t.messages || []), message], updatedAt: new Date() }
            : t
        );
        setTickets(updateTickets);
        if (isStaff) {
          setArchivedTickets(updateTickets);
        }
      });
      
      socket.on('ticket_updated', (updatedTicket) => {
        if (updatedTicket.status === 'archived') {
          setTickets(prev => prev.filter(t => t.id !== updatedTicket.id));
          if (isStaff) {
            setArchivedTickets(prev => [updatedTicket, ...prev]);
          }
        } else {
          if (isStaff) {
            setArchivedTickets(prev => prev.filter(t => t.id !== updatedTicket.id));
          }
          setTickets(prev => {
            const filtered = prev.filter(t => t.id !== updatedTicket.id);
            return [updatedTicket, ...filtered];
          });
        }
        if (selectedTicket?.id === updatedTicket.id) {
          setSelectedTicket(updatedTicket);
          setMessages(updatedTicket.messages || []);
        }
      });
      
      socket.on('ticket_deleted', ({ id }) => {
        if (isStaff) {
          setArchivedTickets(prev => prev.filter(t => t.id !== id));
        }
        if (selectedTicket?.id === id) {
          setSelectedTicket(null);
          setMessages([]);
        }
      });

      socket.on('message-delivered', ({ messageId }) => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, delivered: true } : msg
        ));
      });

      socket.on('message-read', ({ messageId }) => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true, delivered: true } : msg
        ));
      });
    }
    
    return () => {
      if (socket) {
        socket.off('new_ticket');
        socket.off('ticket_message');
        socket.off('ticket_updated');
        socket.off('ticket_deleted');
        socket.off('message-delivered');
        socket.off('message-read');
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (selectedTicket) {
      setMessages(selectedTicket.messages || []);
    }
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const markMessageAsRead = (messageId) => {
    if (socket && selectedTicket) {
      socket.emit('message-read', { messageId, roomId: `ticket_${selectedTicket.id}` });
    }
  };

  useEffect(() => {
    const lastMessage = messages.filter(m => m.userId !== user?.id).pop();
    if (lastMessage && !lastMessage.isRead) {
      markMessageAsRead(lastMessage.id);
    }
  }, [messages, user?.id]);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = isStaff ? await ticketsAPI.getAllTickets() : await ticketsAPI.getMyTickets();
      setTickets(response.data.tickets || []);
      if (isStaff) {
        setArchivedTickets(response.data.archived || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки заявок');
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    if (!newTicketTitle || !newTicketDesc) return;
    setError('');
    try {
      const response = await ticketsAPI.createTicket({ title: newTicketTitle, description: newTicketDesc });
      setTickets(prev => [response.data.ticket, ...prev]);
      setNewTicketTitle('');
      setNewTicketDesc('');
      setShowCreateForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания заявки');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setError('');
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      ticketId: selectedTicket.id,
      userId: user.id,
      username: user.username,
      message: newMessage,
      isStaff: isStaff,
      createdAt: new Date(),
      isRead: false,
      delivered: false
    };
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      await ticketsAPI.sendMessage(selectedTicket.id, { message: newMessage });
      setNewMessage('');
      
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, delivered: true } : msg
        ));
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки сообщения');
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  const assignTicket = async (ticketId) => {
    setError('');
    try {
      await ticketsAPI.assignTicket(ticketId);
      await fetchTickets();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка назначения заявки');
    }
  };

  const closeTicket = async (ticketId) => {
    setError('');
    try {
      await ticketsAPI.closeTicket(ticketId);
      await fetchTickets();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка закрытия заявки');
    }
  };

  const reopenTicket = async (ticketId) => {
    setError('');
    try {
      await ticketsAPI.reopenTicket(ticketId);
      await fetchTickets();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка открытия заявки');
    }
  };

  const archiveTicket = async (ticketId) => {
    setError('');
    try {
      await ticketsAPI.archiveTicket(ticketId);
      await fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка архивации заявки');
    }
  };

  const renderMessageStatus = (msg) => {
    if (msg.userId === user?.id) {
      if (msg.isRead) {
        return <span className="ticket-message-status read">✓✓</span>;
      }
      if (msg.delivered) {
        return <span className="ticket-message-status delivered">✓✓</span>;
      }
      return <span className="ticket-message-status sent">✓</span>;
    } else {
      if (msg.isRead) {
        return <span className="ticket-message-status read">✓✓</span>;
      }
      if (msg.delivered) {
        return <span className="ticket-message-status delivered">✓✓</span>;
      }
      return <span className="ticket-message-status delivered">✓✓</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'open': return <span className="status-badge open">🟡 Открыта</span>;
      case 'in_progress': return <span className="status-badge in-progress">🔵 В работе</span>;
      case 'closed': return <span className="status-badge closed">✅ Закрыта</span>;
      case 'archived': return <span className="status-badge archived">📦 В архиве</span>;
      default: return null;
    }
  };

  const currentTickets = showArchived ? archivedTickets : tickets;
  const activeCount = tickets.filter(t => t.status !== 'closed' && t.status !== 'archived').length;

  if (!user) return null;

  return (
    <>
      <button className={`support-button ${theme}`} onClick={() => setIsOpen(!isOpen)}>
        🎫 Поддержка
        {activeCount > 0 && <span className="support-badge">{activeCount}</span>}
      </button>

      {isOpen && (
        <div className={`support-modal ${theme}`}>
          <div className="support-header">
            <h3>🎫 Система поддержки</h3>
            <button className="close-support" onClick={() => setIsOpen(false)}>✖</button>
          </div>

          {error && <div className="support-error">⚠️ {error}</div>}

          {!isStaff && (
            <div className="support-create-area">
              <button onClick={() => setShowCreateForm(!showCreateForm)} className="create-ticket-small">
                {showCreateForm ? '✖' : '+ Создать заявку'}
              </button>
              {showCreateForm && (
                <form onSubmit={createTicket} className="create-ticket-mini">
                  <input type="text" placeholder="Тема заявки" value={newTicketTitle} onChange={(e) => setNewTicketTitle(e.target.value)} required />
                  <textarea placeholder="Опишите проблему..." value={newTicketDesc} onChange={(e) => setNewTicketDesc(e.target.value)} required rows="2" />
                  <div className="mini-actions">
                    <button type="submit">📤 Отправить</button>
                    <button type="button" onClick={() => setShowCreateForm(false)}>Отмена</button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="support-tabs">
            <button className={`tab-btn ${!showArchived ? 'active' : ''}`} onClick={() => setShowArchived(false)}>
              📋 Активные заявки ({tickets.length})
            </button>
            {isStaff && (
              <button className={`tab-btn ${showArchived ? 'active' : ''}`} onClick={() => setShowArchived(true)}>
                📦 Архив ({archivedTickets.length})
              </button>
            )}
          </div>

          <div className="support-container">
            <div className="support-ticket-list">
              {loading ? (
                <div className="support-loading">Загрузка...</div>
              ) : currentTickets.length === 0 ? (
                <div className="no-tickets">Нет заявок</div>
              ) : (
                currentTickets.map(ticket => (
                  <div key={ticket.id} className={`support-ticket-item ${selectedTicket?.id === ticket.id ? 'active' : ''}`} onClick={() => setSelectedTicket(ticket)}>
                    <div className="ticket-title-mini">{ticket.title}</div>
                    <div className="ticket-status-mini">{getStatusBadge(ticket.status)}</div>
                    <div className="ticket-date">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>

            <div className="support-chat-area">
              {selectedTicket ? (
                <>
                  <div className="support-chat-header">
                    <div>
                      <strong>{selectedTicket.title}</strong>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    <div className="chat-header-buttons">
                      {isStaff && selectedTicket.status === 'open' && (
                        <button onClick={() => assignTicket(selectedTicket.id)} className="mini-assign">📋 Взять в работу</button>
                      )}
                      {isStaff && selectedTicket.status === 'in_progress' && (
                        <button onClick={() => closeTicket(selectedTicket.id)} className="mini-close">✅ Закрыть заявку</button>
                      )}
                      {isStaff && selectedTicket.status === 'closed' && (
                        <>
                          <button onClick={() => reopenTicket(selectedTicket.id)} className="mini-reopen">🔄 Открыть заново</button>
                          <button onClick={() => archiveTicket(selectedTicket.id)} className="mini-archive">📦 В архив</button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="support-chat-messages">
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`ticket-message ${msg.userId === user?.id ? 'ticket-message-user' : 'ticket-message-staff'}`}>
                        <div className="ticket-message-author">
                          {msg.username} 
                          {msg.isStaff && <span className="staff-label">Сотрудник</span>}
                          {msg.userId === user?.id && <span className="staff-label">Вы</span>}
                        </div>
                        <div className="ticket-message-text">{msg.message}</div>
                        <div className="ticket-message-footer">
                          <div className="ticket-message-time">{new Date(msg.createdAt).toLocaleString()}</div>
                          {renderMessageStatus(msg)}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  {selectedTicket.status !== 'closed' && selectedTicket.status !== 'archived' && (
                    <div className="support-chat-input">
                      <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Введите сообщение..." rows="2" />
                      <button onClick={sendMessage}>📤 Отправить</button>
                    </div>
                  )}
                  {selectedTicket.status === 'closed' && (
                    <div className="support-chat-closed">
                      <p>✅ Заявка закрыта</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-selected">Выберите заявку для просмотра</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportButton;