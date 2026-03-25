import React from 'react';
import PostsManager from './PostsManager';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
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

        <PostsManager user={user} />

        <button onClick={onLogout} className="logout-button">
          Выйти
        </button>
      </div>
    </div>
  );
};

export default Dashboard;