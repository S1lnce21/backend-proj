import React, { useState, useEffect } from 'react';
import { postsAPI } from '../services/api';
import './PostsManager.css';

const PostsManager = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, [view]);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = view === 'all' 
        ? await postsAPI.getAllPosts()
        : await postsAPI.getMyPosts();
      setPosts(response.data.posts);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при загрузке постов');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const response = await postsAPI.createPost(formData);
      setPosts([response.data.post, ...posts]);
      setFormData({ title: '', content: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при создании поста');
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    try {
      const response = await postsAPI.updatePost(editingPost.id, formData);
      setPosts(posts.map(post => 
        post.id === editingPost.id ? response.data.post : post
      ));
      setEditingPost(null);
      setFormData({ title: '', content: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при обновлении поста');
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот пост?')) return;
    try {
      await postsAPI.deletePost(id);
      setPosts(posts.filter(post => post.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при удалении поста');
    }
  };

  const startEdit = (post) => {
    setEditingPost(post);
    setFormData({ title: post.title, content: post.content });
    setShowForm(true);
  };

  const cancelForm = () => {
    setEditingPost(null);
    setFormData({ title: '', content: '' });
    setShowForm(false);
    setError('');
  };

  return (
    <div className="posts-manager">
      <div className="posts-header">
        <h2>Управление постами</h2>
        <div className="posts-controls">
          <button 
            onClick={() => setView('all')}
            className={view === 'all' ? 'active' : ''}
          >
            Все посты
          </button>
          <button 
            onClick={() => setView('my')}
            className={view === 'my' ? 'active' : ''}
          >
            Мои посты
          </button>
          <button onClick={() => setShowForm(!showForm)} className="create-btn">
            {showForm ? 'Отмена' : '+ Создать пост'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={editingPost ? handleUpdatePost : handleCreatePost} className="post-form">
          <h3>{editingPost ? 'Редактировать пост' : 'Создать новый пост'}</h3>
          <input
            type="text"
            placeholder="Заголовок"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Содержание"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows="5"
          />
          <div className="form-actions">
            <button type="submit">
              {editingPost ? 'Обновить' : 'Создать'}
            </button>
            <button type="button" onClick={cancelForm}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading">Загрузка постов...</div>
      ) : posts.length === 0 ? (
        <div className="no-posts">Постов пока нет. Создайте первый!</div>
      ) : (
        <div className="posts-list">
          {posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <h3>{post.title}</h3>
                <div className="post-meta">
                  <span className="post-author">Автор: {post.author.username}</span>
                  <span className="post-date">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="post-content">{post.content}</p>
              {post.authorId === user?.id && (
                <div className="post-actions">
                  <button onClick={() => startEdit(post)} className="edit-btn">
                    Редактировать
                  </button>
                  <button onClick={() => handleDeletePost(post.id)} className="delete-btn">
                    Удалить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostsManager;