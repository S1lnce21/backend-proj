import React from 'react';
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

        <div className="dashboard-content">
          <p>Вы успешно авторизовались в системе!</p>
          <p>Это защищенная страница, доступная только авторизованным пользователям.</p>
        </div>

        <button onClick={onLogout} className="logout-button">
          Выйти
        </button>
      </div>
    </div>
  );
};

export default Dashboard;