import React, { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../services/notificationApi';
import './styles/NotificationBell.css';

const NotificationBell = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Ошибка при отметке прочитанного:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Ошибка при отметке всех:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.delete(id);
      const deleted = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (!deleted.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Ошибка при удалении:', error);
    }
  };

  const deleteAll = async () => {
    try {
      await notificationAPI.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Ошибка при удалении всех:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getTypeClass = (type) => {
    switch(type) {
      case 'success': return 'notification-success';
      case 'warning': return 'notification-warning';
      case 'error': return 'notification-error';
      default: return 'notification-info';
    }
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button className="bell-button" onClick={() => setIsOpen(!isOpen)}>
        🔔
        {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Уведомления</h3>
            <div className="notification-actions">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllAsRead} className="action-btn">✅ Все прочитаны</button>
                  <button onClick={deleteAll} className="action-btn danger">🗑️ Удалить все</button>
                </>
              )}
            </div>
          </div>

          <div className="notification-list">
            {loading && <div className="notification-loading">Загрузка...</div>}
            
            {!loading && notifications.length === 0 && (
              <div className="notification-empty">
                <span>📭</span>
                <p>Нет уведомлений</p>
              </div>
            )}

            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${getTypeClass(notification.type)} ${!notification.isRead ? 'unread' : ''}`}
              >
                <div className="notification-icon">{getTypeIcon(notification.type)}</div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="notification-buttons">
                  {!notification.isRead && (
                    <button onClick={() => markAsRead(notification.id)} className="read-btn" title="Отметить прочитанным">
                      ✓
                    </button>
                  )}
                  <button onClick={() => deleteNotification(notification.id)} className="delete-btn" title="Удалить">
                    ✗
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;