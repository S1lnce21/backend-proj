import React, { useState, useEffect } from 'react';
import { postsAPI } from '../services/api';
import { notificationAPI } from '../services/notificationApi';
import { useApp } from '../context/AppContext';
import './styles/PostsManager.css';

const PostsManager = ({ user }) => {
  const { t, theme } = useApp();
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
      const response = view === 'all' ? await postsAPI.getAllPosts() : await postsAPI.getMyPosts();
      setPosts(response.data.posts);
    } catch (err) {
      setError(err.response?.data?.error || t('errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await postsAPI.createPost(formData);
      setPosts([response.data.post, ...posts]);
      setFormData({ title: '', content: '' });
      setShowForm(false);
      await notificationAPI.create({ title: t('postCreated'), message: `${t('postCreated')} "${response.data.post.title}"`, type: 'success' });
    } catch (err) {
      setError(err.response?.data?.error || t('errorCreating'));
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await postsAPI.updatePost(editingPost.id, formData);
      setPosts(posts.map(post => post.id === editingPost.id ? response.data.post : post));
      setEditingPost(null);
      setFormData({ title: '', content: '' });
      setShowForm(false);
      await notificationAPI.create({ title: t('postUpdated'), message: `${t('postUpdated')} "${response.data.post.title}"`, type: 'info' });
    } catch (err) {
      setError(err.response?.data?.error || t('errorUpdating'));
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Вы уверены?')) return;
    setError('');
    try {
      const deletedPost = posts.find(p => p.id === id);
      await postsAPI.deletePost(id);
      setPosts(posts.filter(post => post.id !== id));
      await notificationAPI.create({ title: t('postDeleted'), message: `${t('postDeleted')} "${deletedPost?.title}"`, type: 'warning' });
    } catch (err) {
      setError(err.response?.data?.error || t('errorDeleting'));
    }
  };

  const startEdit = (post) => {
    setEditingPost(post);
    setFormData({ title: post.title, content: post.content || '' });
    setShowForm(true);
  };

  const cancelForm = () => {
    setEditingPost(null);
    setFormData({ title: '', content: '' });
    setShowForm(false);
    setError('');
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

  const controlBtnStyle = (isActive) => ({
    padding: '8px 20px',
    border: isActive ? 'none' : `2px solid ${theme === 'dark' ? '#3a3a4e' : '#e0e0e0'}`,
    background: isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : theme === 'dark' ? '#2a2a3e' : 'white',
    borderRadius: '25px',
    cursor: 'pointer',
    fontWeight: '500',
    color: isActive ? 'white' : theme === 'dark' ? '#aaa' : '#666',
    fontSize: '14px',
    transition: 'all 0.3s'
  });

  return (
    <div className={`posts-manager ${theme}`}>
      <div className="posts-header">
        <h2 style={{ color: theme === 'dark' ? '#fff' : '#333' }}>{t('postsManagement')}</h2>
        <div className="posts-controls">
          <button onClick={() => setView('all')} style={controlBtnStyle(view === 'all')}>{t('allPosts')}</button>
          <button onClick={() => setView('my')} style={controlBtnStyle(view === 'my')}>{t('myPosts')}</button>
          <button 
            onClick={() => setShowForm(!showForm)} 
            style={createBtnStyle}
            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)'; }}
          >
            {showForm ? t('cancel') : `+ ${t('createPost')}`}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={editingPost ? handleUpdatePost : handleCreatePost} className={`post-form ${theme}`}>
          <h3>{editingPost ? t('editPost') : t('createNewPost')}</h3>
          <input type="text" placeholder={t('title')} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="post-form-input" />
          <textarea placeholder={t('content')} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required rows="5" className="post-form-textarea" />
          <div className="form-actions">
            <button type="submit" className="submit-btn">{editingPost ? t('save') : t('create')}</button>
            <button type="button" onClick={cancelForm} className="cancel-btn">{t('cancel')}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-posts">{t('loading')}...</div>
      ) : posts.length === 0 ? (
        <div className={`no-posts ${theme}`}>{t('noPosts')}</div>
      ) : (
        <div className="posts-list">
          {posts.map(post => (
            <div key={post.id} className={`post-card ${theme}`}>
              <div className="post-header">
                <h3 className="post-title">{post.title}</h3>
                <div className="post-meta">
                  <span className="post-author">{t('author')}: {post.author.username}</span>
                  <span className="post-date">{new Date(post.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <p className="post-content">{post.content}</p>
              {post.authorId === user?.id && (
                <div className="post-actions">
                  <button onClick={() => startEdit(post)} style={editBtnStyle} onMouseEnter={(e) => { e.target.style.background = '#2980b9'; e.target.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.target.style.background = '#3498db'; e.target.style.transform = 'translateY(0)'; }}>{t('edit')}</button>
                  <button onClick={() => handleDeletePost(post.id)} style={deleteBtnStyle} onMouseEnter={(e) => { e.target.style.background = '#c0392b'; e.target.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.target.style.background = '#e74c3c'; e.target.style.transform = 'translateY(0)'; }}>{t('delete')}</button>
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