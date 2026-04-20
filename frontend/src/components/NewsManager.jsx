import React, { useState, useEffect } from 'react';
import { newsAPI } from '../services/api';
import { notificationAPI } from '../services/notificationApi';
import { useApp } from '../context/AppContext';
import './styles/NewsManager.css';

const NewsManager = ({ user }) => {
  const { t, theme } = useApp();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', imageUrl: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

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
      setNews([response.data.news, ...news]);
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
      setNews(news.map(item => item.id === editingNews.id ? response.data.news : item));
      setEditingNews(null);
      setFormData({ title: '', content: '', imageUrl: '' });
      setShowForm(false);
      await notificationAPI.create({ title: t('newsUpdated'), message: `${t('newsUpdated')} "${response.data.news.title}"`, type: 'info' });
    } catch (err) {
      setError(err.response?.data?.error || t('errorUpdating'));
    }
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm('Вы уверены?')) return;
    try {
      const deletedNews = news.find(n => n.id === id);
      await newsAPI.deleteNews(id);
      setNews(news.filter(item => item.id !== id));
      await notificationAPI.create({ title: t('newsDeleted'), message: `${t('newsDeleted')} "${deletedNews?.title}"`, type: 'warning' });
    } catch (err) {
      setError(err.response?.data?.error || t('errorDeleting'));
    }
  };

  const startEdit = (item) => {
    setEditingNews(item);
    setFormData({ title: item.title, content: item.content, imageUrl: item.imageUrl || '' });
    setShowForm(true);
  };

  const createBtnStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
  };

  const deleteBtnStyle = {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '8px 24px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(231, 76, 60, 0.3)'
  };

  const editBtnStyle = {
    background: '#3498db',
    color: 'white',
    border: 'none',
    padding: '8px 24px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)'
  };

  return (
    <div className={`news-manager ${theme}`}>
      <div className="section-header">
        <h2>📰 {t('newsManagement')}</h2>
        <button onClick={() => setShowForm(!showForm)} style={createBtnStyle} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)'; }}>
          {showForm ? t('cancel') : `+ ${t('createNews')}`}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={editingNews ? handleUpdateNews : handleCreateNews} className={`news-form ${theme}`}>
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
        <div className={`no-news ${theme}`}>
          {t('noNews')}<br />
          <small>{t('clickToCreate')}</small>
        </div>
      ) : (
        <div className="news-list">
          {news.map(item => (
            <div key={item.id} className={`news-card ${theme}`}>
              {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="news-image" />}
              <div className="news-content">
                <h3>{item.title}</h3>
                <div className="news-meta">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>{item.author.username}</span>
                </div>
                <p>{item.content}</p>
                {item.authorId === user?.id && (
                  <div className="news-actions">
                    <button onClick={() => startEdit(item)} style={editBtnStyle} onMouseEnter={(e) => { e.target.style.background = '#2980b9'; e.target.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.target.style.background = '#3498db'; e.target.style.transform = 'translateY(0)'; }}>{t('edit')}</button>
                    <button onClick={() => handleDeleteNews(item.id)} style={deleteBtnStyle} onMouseEnter={(e) => { e.target.style.background = '#c0392b'; e.target.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.target.style.background = '#e74c3c'; e.target.style.transform = 'translateY(0)'; }}>{t('delete')}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsManager;