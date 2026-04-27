import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { newsAPI } from '../../services/api';
import { notificationAPI } from '../../services/notificationApi';
import { useApp } from '../../context/AppContext';
import '../styles/NewsManager.css';

let socket = null;

const NewsManager = ({ user }) => {
  const { t, theme } = useApp();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', imageUrl: '' });
  const [showForm, setShowForm] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const canDelete = isAdmin || isModerator;

  useEffect(() => {
    fetchNews();
    
    if (!socket) {
      socket = io('http://localhost:3000');
      socket.emit('join-user', user?.id);
      
      socket.on('news_created', (newNews) => {
        setNews(prev => [newNews, ...prev]);
      });
      
      socket.on('news_updated', (updatedNews) => {
        setNews(prev => prev.map(item => item.id === updatedNews.id ? updatedNews : item));
      });
      
      socket.on('news_deleted', ({ id }) => {
        setNews(prev => prev.filter(item => item.id !== id));
      });
    }
    
    return () => {
      if (socket) {
        socket.off('news_created');
        socket.off('news_updated');
        socket.off('news_deleted');
      }
    };
  }, [user?.id]);

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await newsAPI.getAllNews();
      setNews(response.data.news);
    } catch (err) {
      setError(err.response?.data?.error || t('errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNews = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await newsAPI.createNews(formData);
      setFormData({ title: '', content: '', imageUrl: '' });
      setShowForm(false);
      await notificationAPI.create({ title: t('newsCreated'), message: `${t('newsCreated')} "${response.data.news.title}"`, type: 'success' });
    } catch (err) {
      setError(err.response?.data?.error || t('errorCreating'));
    }
  };

  const handleUpdateNews = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await newsAPI.updateNews(editingNews.id, formData);
      setEditingNews(null);
      setFormData({ title: '', content: '', imageUrl: '' });
      setShowForm(false);
      await notificationAPI.create({ title: t('newsUpdated'), message: `${t('newsUpdated')} "${response.data.news.title}"`, type: 'info' });
    } catch (err) {
      setError(err.response?.data?.error || t('errorUpdating'));
    }
  };

  const handleDeleteNews = async (id, authorId) => {
    const canDeleteNews = canDelete || authorId === user?.id;
    if (!canDeleteNews) {
      setError('У вас нет прав на удаление этой новости');
      return;
    }
    
    if (!window.confirm('Вы уверены, что хотите удалить эту новость?')) return;
    try {
      const deletedNews = news.find(n => n.id === id);
      await newsAPI.deleteNews(id);
      await notificationAPI.create({ title: t('newsDeleted'), message: `${t('newsDeleted')} "${deletedNews?.title}"`, type: 'warning' });
    } catch (err) {
      setError(err.response?.data?.error || t('errorDeleting'));
    }
  };

  const startEdit = (item) => {
    if (!canDelete && item.authorId !== user?.id) {
      setError('У вас нет прав на редактирование этой новости');
      return;
    }
    setEditingNews(item);
    setFormData({ title: item.title, content: item.content, imageUrl: item.imageUrl || '' });
    setShowForm(true);
  };

  return (
    <div className={`news-manager ${theme}`}>
      <div className="section-header">
        <h2>📰 {t('newsManagement')}</h2>
        <button onClick={() => setShowForm(!showForm)} className="create-news-btn">
          {showForm ? t('cancel') : `+ ${t('createNews')}`}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={editingNews ? handleUpdateNews : handleCreateNews} className="news-form">
          <h3>{editingNews ? t('editNews') : t('createNewNews')}</h3>
          <input type="text" placeholder={t('title')} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          <textarea placeholder={t('content')} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required rows="5" />
          <input type="text" placeholder={t('imageUrl')} value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
          <div className="form-actions">
            <button type="submit">{editingNews ? t('save') : t('create')}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingNews(null); setFormData({ title: '', content: '', imageUrl: '' }); }}>{t('cancel')}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading">{t('loading')}...</div>
      ) : news.length === 0 ? (
        <div className="no-news">
          {t('noNews')}<br />
          <small>{t('clickToCreate')}</small>
        </div>
      ) : (
        <div className="news-list">
          {news.map(item => {
            const canEditDelete = canDelete || item.authorId === user?.id;
            return (
              <div key={item.id} className="news-card">
                {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="news-image" onError={(e) => { e.target.style.display = 'none'; }} />}
                <div className="news-content">
                  <h3>{item.title}</h3>
                  <div className="news-meta">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span>
                      {item.author.username}
                      {item.author.role === 'admin' && <span className="role-tag admin-tag">👑 Admin</span>}
                      {item.author.role === 'moderator' && <span className="role-tag moderator-tag">🛡️ Mod</span>}
                    </span>
                  </div>
                  <p>{item.content}</p>
                  {canEditDelete && (
                    <div className="news-actions">
                      <button onClick={() => startEdit(item)} className="edit-news-btn">{t('edit')}</button>
                      <button onClick={() => handleDeleteNews(item.id, item.authorId)} className="delete-news-btn">{t('delete')}</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NewsManager;