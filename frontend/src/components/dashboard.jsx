import React, { useState } from 'react';
import PostsManager from './PostsManager';
import NewsManager from './NewsManager';
import ProductsManager from './ProductsManager';
import './styles/Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('posts');

  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        <h2>Добро пожаловать, {user?.username}!</h2>
        
        <div className="user-info">
          <h3>Ваши данные:</h3>
          <p><strong>ID:</strong> {user?.id}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Имя пользователя:</strong> {user?.username}</p>
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

        <button onClick={onLogout} className="logout-button">
          Выйти
        </button>
      </div>
    </div>
  );
};

export default Dashboard;