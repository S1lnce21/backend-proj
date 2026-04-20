import React, { useState } from 'react';
import PostsManager from './PostsManager';
import NewsManager from './NewsManager';
import ProductsManager from './ProductsManager';
import NotificationBell from '../layout/NotificationBell';
import UserMenu from '../layout/UserMenu';
import { useApp } from '../../context/AppContext';
import '../styles/Dashboard.css';

const Dashboard = ({ user, onLogout, onUpdateUser }) => {
  const { t, theme } = useApp();
  const [activeTab, setActiveTab] = useState('posts');

  return (
    <div className={`dashboard-container ${theme}`}>
      <div className={`dashboard-box ${theme}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: theme === 'dark' ? '#fff' : '#333' }}>
            {t('welcome')}, {user?.username}!
          </h2>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <NotificationBell userId={user?.id} />
            <UserMenu user={user} onLogout={onLogout} onUpdateUser={onUpdateUser} />
          </div>
        </div>

        <div className="tabs">
          <button 
            className={activeTab === 'posts' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('posts')}
          >
            📝 {t('posts')}
          </button>
          <button 
            className={activeTab === 'news' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('news')}
          >
            📰 {t('news')}
          </button>
          <button 
            className={activeTab === 'products' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('products')}
          >
            🛍️ {t('products')}
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'posts' && <PostsManager user={user} />}
          {activeTab === 'news' && <NewsManager user={user} />}
          {activeTab === 'products' && <ProductsManager user={user} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;