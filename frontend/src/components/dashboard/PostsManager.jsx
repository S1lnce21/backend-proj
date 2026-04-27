import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { postsAPI } from '../../services/api';
import { notificationAPI } from '../../services/notificationApi';
import { useApp } from '../../context/AppContext';
import '../styles/PostsManager.css';

let socket = null;

const PostsManager = ({ user }) => {
  const { t, theme } = useApp();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 3;

  useEffect(() => {
    fetchPosts();
    
    if (!socket) {
      socket = io('http://localhost:3000');
      socket.emit('join-user', user?.id);
      
      socket.on('post_created', (newPost) => {
        setPosts(prev => [newPost, ...prev]);
      });
      
      socket.on('post_updated', (updatedPost) => {
        setPosts(prev => prev.map(post => post.id === updatedPost.id ? updatedPost : post));
      });
      
      socket.on('post_deleted', ({ id }) => {
        setPosts(prev => prev.filter(post => post.id !== id));
      });
    }
    
    return () => {
      if (socket) {
        socket.off('post_created');
        socket.off('post_updated');
        socket.off('post_deleted');
      }
    };
  }, [view, user?.id]);

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

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

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`posts-manager ${theme}`}>
      <div className="posts-header">
        <h2>{t('postsManagement')}</h2>
        <div className="posts-controls">
          <button onClick={() => setView('all')} className={`posts-controls-btn ${view === 'all' ? 'active' : ''}`}>
            {t('allPosts')}
          </button>
          <button onClick={() => setView('my')} className={`posts-controls-btn ${view === 'my' ? 'active' : ''}`}>
            {t('myPosts')}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="create-post-btn">
            {showForm ? t('cancel') : `+ ${t('createPost')}`}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={editingPost ? handleUpdatePost : handleCreatePost} className="post-form">
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
        <div className="no-posts">{t('noPosts')}</div>
      ) : (
        <>
          <div className="posts-list">
            {currentPosts.map(post => (
              <div key={post.id} className="post-card">
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
                    <button onClick={() => startEdit(post)} className="edit-post-btn">{t('edit')}</button>
                    <button onClick={() => handleDeletePost(post.id)} className="delete-post-btn">{t('delete')}</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>←</button>
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button key={page} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => goToPage(page)}>
                      {page}
                    </button>
                  );
                }
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="pagination-dots">...</span>;
                }
                return null;
              })}
              <button className="pagination-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostsManager;