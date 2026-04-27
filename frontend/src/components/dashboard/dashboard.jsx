import React, { useState } from 'react';
import PostsManager from './PostsManager';
import NewsManager from './NewsManager';
import ProductsManager from './ProductsManager';
import UserManager from '../admin/UserManager';
import NotificationBell from '../layout/NotificationBell';
import UserMenu from '../layout/UserMenu';
import { useApp } from '../../context/AppContext';
import '../styles/Dashboard.css';

const Dashboard = ({ user, onLogout, onUpdateUser }) => {
  const { t, theme } = useApp();
  const [activeTab, setActiveTab] = useState('posts');

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';

  const getRoleLabel = () => {
    if (user?.role === 'admin') return t('adminRole');
    if (user?.role === 'moderator') return t('moderatorRole');
    return t('userRole');
  };

  const getRoleClass = () => {
    if (user?.role === 'admin') return 'role-admin';
    if (user?.role === 'moderator') return 'role-moderator';
    return 'role-user';
  };

  return (
    <div className={`dashboard-container ${theme}`}>
      <div className={`dashboard-box ${theme}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0, color: theme === 'dark' ? '#fff' : '#333' }}>
              {t('welcome')}, {user?.username}!
            </h2>
            <span className={`user-role-badge ${getRoleClass()}`}>
              {getRoleLabel()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <NotificationBell userId={user?.id} />
            <UserMenu user={user} onLogout={onLogout} onUpdateUser={onUpdateUser} />
          </div>
        </div>

        <div className="tabs">
          <button className={activeTab === 'posts' ? 'tab active' : 'tab'} onClick={() => setActiveTab('posts')}>
            📝 {t('posts')}
          </button>
          <button className={activeTab === 'news' ? 'tab active' : 'tab'} onClick={() => setActiveTab('news')}>
            📰 {t('news')}
          </button>
          <button className={activeTab === 'products' ? 'tab active' : 'tab'} onClick={() => setActiveTab('products')}>
            🛍️ {t('products')}
          </button>
          {isAdmin && (
            <button className={activeTab === 'admin' ? 'tab active' : 'tab'} onClick={() => setActiveTab('admin')}>
              👑 {t('adminPanel')}
            </button>
          )}
        </div>

        <div className="tab-content">
          {activeTab === 'posts' && <PostsManager user={user} />}
          {activeTab === 'news' && <NewsManager user={user} />}
          {activeTab === 'products' && <ProductsManager user={user} />}
          {activeTab === 'admin' && <UserManager user={user} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;