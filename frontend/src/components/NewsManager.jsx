import React, { useState, useEffect } from 'react';
import { newsAPI } from '../services/api';
import './styles/NewsManager.css';

const NewsManager = ({ user }) => {
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
      setError(err.response?.data?.error || 'Ошибка при загрузке новостей');
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
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при создании новости');
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
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при обновлении новости');
    }
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту новость?')) return;
    try {
      await newsAPI.deleteNews(id);
      setNews(news.filter(item => item.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при удалении новости');
    }
  };

  const startEdit = (item) => {
    setEditingNews(item);
    setFormData({ title: item.title, content: item.content, imageUrl: item.imageUrl || '' });
    setShowForm(true);
  };

  return (
    <div className="news-manager">
      <div className="section-header">
        <h2>📰 Новости</h2>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="create-news-btn"
        >
          {showForm ? '✖ Отмена' : '+ Создать новость'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={editingNews ? handleUpdateNews : handleCreateNews} className="news-form">
          <h3>{editingNews ? '✏️ Редактировать новость' : '✨ Создать новость'}</h3>
          <input
            type="text"
            placeholder="Заголовок новости"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Содержание новости"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows="5"
          />
          <input
            type="text"
            placeholder="🔗 URL изображения (опционально)"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          />
          <div className="form-actions">
            <button type="submit">
              {editingNews ? '📝 Обновить' : '✅ Создать'}
            </button>
            <button type="button" onClick={() => {
              setShowForm(false);
              setEditingNews(null);
              setFormData({ title: '', content: '', imageUrl: '' });
            }}>
              ❌ Отмена
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading">Загрузка новостей</div>
      ) : news.length === 0 ? (
        <div className="no-news">
          Новостей пока нет<br />
          <small>Нажмите кнопку "Создать новость", чтобы добавить первую!</small>
        </div>
      ) : (
        <div className="news-list">
          {news.map(item => (
            <div key={item.id} className="news-card">
              {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="news-image" />}
              <div className="news-content">
                <h3>{item.title}</h3>
                <div className="news-meta">
                  <span>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
                  <span>{item.author.username}</span>
                </div>
                <p>{item.content}</p>
                {item.authorId === user?.id && (
                  <div className="news-actions">
                    <button onClick={() => startEdit(item)} className="edit-news-btn">
                      ✏️ Редактировать
                    </button>
                    <button onClick={() => handleDeleteNews(item.id)} className="delete-news-btn">
                      🗑️ Удалить
                    </button>
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