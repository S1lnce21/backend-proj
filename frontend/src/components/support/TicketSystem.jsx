import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { ticketsAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';
import '../styles/TicketSystem.css';

let socket = null;

const TicketSystem = ({ user }) => {
  const { t, theme } = useApp();
  const [tickets, setTickets] = useState([]);
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
    fetchTickets();
    
    if (!socket) {
      socket = io('http://localhost:3000');
      socket.emit('join-user', user?.id);
      
      socket.on('new_ticket', (ticket) => {
        if (isStaff || ticket.userId === user?.id) {
          setTickets(prev => [ticket, ...prev]);
        }
      });
      
      socket.on('ticket_message', ({ ticketId, message }) => {
        if (selectedTicket?.id === ticketId) {
          setMessages(prev => [...prev, message]);
        }
        setTickets(prev => prev.map(t => 
          t.id === ticketId 
            ? { ...t, messages: [...(t.messages || []), message], updatedAt: new Date() }
            : t
        ));
      });
      
      socket.on('ticket_updated', (updatedTicket) => {
        setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        if (selectedTicket?.id === updatedTicket.id) {
          setSelectedTicket(updatedTicket);
          setMessages(updatedTicket.messages || []);
        }
      });
    }
    
    return () => {
      if (socket) {
        socket.off('new_ticket');
        socket.off('ticket_message');
        socket.off('ticket_updated');
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

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = isStaff ? await ticketsAPI.getAllTickets() : await ticketsAPI.getMyTickets();
      setTickets(response.data.tickets || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки заявок');
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    if (!newTicketTitle || !newTicketDesc) return;
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
    try {
      await ticketsAPI.sendMessage(selectedTicket.id, { message: newMessage });
      setNewMessage('');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки сообщения');
    }
  };

  const assignTicket = async (ticketId) => {
    try {
      await ticketsAPI.assignTicket(ticketId);
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка назначения заявки');
    }
  };

  const closeTicket = async (ticketId) => {
    try {
      await ticketsAPI.closeTicket(ticketId);
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка закрытия заявки');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'open': return <span className="status-badge open">🟡 Открыта</span>;
      case 'in_progress': return <span className="status-badge in-progress">🔵 В работе</span>;
      case 'closed': return <span className="status-badge closed">✅ Закрыта</span>;
      default: return null;
    }
  };

  return (
    <div className={`ticket-system ${theme}`}>
      <div className="ticket-system-header">
        <h2>🎫 Система поддержки</h2>
        {!isStaff && (
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="create-ticket-btn">
            {showCreateForm ? '✖ Отмена' : '+ Создать заявку'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && !isStaff && (
        <form onSubmit={createTicket} className="create-ticket-form">
          <h3>Новая заявка</h3>
          <input type="text" placeholder="Тема заявки" value={newTicketTitle} onChange={(e) => setNewTicketTitle(e.target.value)} required />
          <textarea placeholder="Опишите проблему..." value={newTicketDesc} onChange={(e) => setNewTicketDesc(e.target.value)} required rows="4" />
          <div className="form-actions">
            <button type="submit">📤 Отправить</button>
            <button type="button" onClick={() => setShowCreateForm(false)}>Отмена</button>
          </div>
        </form>
      )}

      <div className="ticket-container">
        <div className="ticket-list">
          <h3>Заявки</h3>
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : tickets.length === 0 ? (
            <div className="no-tickets">Нет заявок</div>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} className={`ticket-item ${selectedTicket?.id === ticket.id ? 'active' : ''} status-${ticket.status}`} onClick={() => setSelectedTicket(ticket)}>
                <div className="ticket-title">{ticket.title}</div>
                <div className="ticket-meta">
                  {getStatusBadge(ticket.status)}
                  <span>📅 {new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="ticket-user">👤 {ticket.username}</div>
              </div>
            ))
          )}
        </div>

        <div className="ticket-chat">
          {selectedTicket ? (
            <>
              <div className="ticket-chat-header">
                <div>
                  <h3>{selectedTicket.title}</h3>
                  <p>{getStatusBadge(selectedTicket.status)}</p>
                </div>
                {isStaff && selectedTicket.status === 'open' && (
                  <button onClick={() => assignTicket(selectedTicket.id)} className="assign-btn">📋 Взять в работу</button>
                )}
                {isStaff && selectedTicket.status === 'in_progress' && (
                  <button onClick={() => closeTicket(selectedTicket.id)} className="close-ticket-btn">✅ Закрыть заявку</button>
                )}
              </div>
              <div className="ticket-chat-messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`ticket-message ${msg.isStaff ? 'staff-message' : 'user-message'}`}>
                    <div className="message-author">
                      {msg.username} {msg.isStaff && <span className="staff-badge">Сотрудник</span>}
                    </div>
                    <div className="message-text">{msg.message}</div>
                    <div className="message-time">{new Date(msg.createdAt).toLocaleString()}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              {selectedTicket.status !== 'closed' && (
                <div className="ticket-chat-input">
                  <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Введите сообщение..." rows="2" />
                  <button onClick={sendMessage}>📤 Отправить</button>
                </div>
              )}
            </>
          ) : (
            <div className="no-selected-ticket">Выберите заявку для просмотра</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketSystem;