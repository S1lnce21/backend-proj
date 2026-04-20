import React, { useState } from 'react';
import PostsManager from './PostsManager';
import NewsManager from './NewsManager';
import ProductsManager from './ProductsManager';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';
import './styles/Dashboard.css';

const Dashboard = ({ user, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('posts');

  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Добро пожаловать, {user?.username}!</h2>
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
            📝 Посты
          </button>
          <button 
            className={activeTab === 'news' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('news')}
          >
            📰 Новости
          </button>
          <button 
            className={activeTab === 'products' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('products')}
          >
            🛍️ Товары
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