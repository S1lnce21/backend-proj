import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { notificationAPI } from '../services/notificationApi';
import { useApp } from '../context/AppContext';
import './styles/NotificationBell.css';

const NotificationBell = ({ userId }) => {
  const { t, theme, notificationsEnabled, soundEnabled } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [socket, setSocket] = useState(null);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const playSound = () => {
    if (soundEnabled) {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Sound play failed:', e));
    }
  };

  const showToast = (title, message, type) => {
    if (!notificationsEnabled) return;
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type} ${theme}`;
    toast.innerHTML = `
      <div class="toast-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
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
    }, 5000);
  };

  useEffect(() => {
    fetchNotifications();
    
    const newSocket = io('http://localhost:3000');
    newSocket.emit('join-notifications', userId);
    
    newSocket.on('new-notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      showToast(notification.title, notification.message, notification.type);
      playSound();
    });
    
    setSocket(newSocket);
    
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [userId, notificationsEnabled, soundEnabled]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleSelectNotification = (id) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  };

  const deleteSelectedNotifications = async () => {
    for (const id of selectedNotifications) {
      await notificationAPI.delete(id);
    }
    setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
    setUnreadCount(prev => {
      const deletedUnread = notifications.filter(n => selectedNotifications.has(n.id) && !n.isRead).length;
      return Math.max(0, prev - deletedUnread);
    });
    setSelectedNotifications(new Set());
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.delete(id);
      const deleted = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (!deleted?.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
      setSelectedNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('Error:', error);
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
        <div className={`notification-dropdown ${theme}`}>
          <div className="notification-header">
            <h3>{t('notifications')}</h3>
            {notifications.length > 0 && (
              <div className="notification-actions">
                <button onClick={toggleSelectAll} className="action-btn">
                  {selectedNotifications.size === notifications.length ? `✓ ${t('deselectAll')}` : `☐ ${t('selectAll')}`}
                </button>
                {selectedNotifications.size > 0 && (
                  <button onClick={deleteSelectedNotifications} className="action-btn danger">
                    🗑️ {t('deleteSelected')} ({selectedNotifications.size})
                  </button>
                )}
                <button onClick={markAllAsRead} className="action-btn">✅ {t('markAllRead')}</button>
              </div>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 && (
              <div className="notification-empty">
                <span>📭</span>
                <p>{t('noNotifications')}</p>
              </div>
            )}
            {notifications.map(notification => (
              <div key={notification.id} className={`notification-item ${getTypeClass(notification.type)} ${!notification.isRead ? 'unread' : ''}`}>
                <div className="notification-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={() => toggleSelectNotification(notification.id)}
                  />
                </div>
                <div className="notification-icon">{notification.type === 'success' ? '✅' : notification.type === 'warning' ? '⚠️' : notification.type === 'error' ? '❌' : 'ℹ️'}</div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{new Date(notification.createdAt).toLocaleString()}</div>
                </div>
                <div className="notification-buttons">
                  {!notification.isRead && (
                    <button onClick={() => markAsRead(notification.id)} className="read-btn" title={t('markRead')}>✓</button>
                  )}
                  <button onClick={() => deleteNotification(notification.id)} className="delete-btn" title={t('delete')}>✗</button>
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