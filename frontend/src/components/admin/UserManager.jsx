import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import { notificationAPI } from '../../services/notificationApi';
import { useApp } from '../../context/AppContext';
import '../styles/UserManager.css';

const UserManager = ({ user }) => {
  const { t, theme } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.getAllUsers();
      setUsers(response.data.users);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId, newRole, username) => {
    setError('');
    setMessage('');
    try {
      await authAPI.updateUserRole(userId, { role: newRole });
      const roleName = newRole === 'admin' ? 'Администратора' : newRole === 'moderator' ? 'Модератора' : 'Пользователя';
      setMessage(`✅ Пользователю ${username} выдана роль ${roleName}`);
      await notificationAPI.create({
        title: 'Роль изменена',
        message: `Пользователю ${username} выдана роль ${roleName}`,
        type: 'success'
      });
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка изменения роли');
    }
  };

  const banUser = async (userId, username, isBanned) => {
    setError('');
    setMessage('');
    const action = isBanned ? 'разбанен' : 'забанен';
    const confirmMsg = isBanned ? `Вы уверены, что хотите разбанить пользователя ${username}?` : `Вы уверены, что хотите забанить пользователя ${username}?`;
    
    if (!window.confirm(confirmMsg)) return;
    
    try {
      await authAPI.banUser(userId, { isBanned: !isBanned });
      setMessage(`✅ Пользователь ${username} ${action}`);
      await notificationAPI.create({
        title: isBanned ? 'Пользователь разбанен' : 'Пользователь забанен',
        message: `Пользователь ${username} ${action}`,
        type: isBanned ? 'success' : 'warning'
      });
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка изменения статуса пользователя');
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'role-admin';
      case 'moderator': return 'role-moderator';
      default: return 'role-user';
    }
  };

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'Администратор';
      case 'moderator': return 'Модератор';
      default: return 'Пользователь';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className={`access-denied ${theme}`}>
        <div className="access-denied-icon">🔒</div>
        <h3>Доступ запрещен</h3>
        <p>Только администраторы могут управлять пользователями</p>
      </div>
    );
  }

  return (
    <div className={`user-manager ${theme}`}>
      <div className="user-manager-header">
        <h2>👥 Управление пользователями</h2>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {loading ? (
        <div className="loading-users">Загрузка...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя пользователя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Дата регистрации</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={`${u.id === user?.id ? 'current-user' : ''} ${u.isBanned ? 'banned-user' : ''}`}>
                  <td>{u.id}</td>
                  <td>
                    {u.username}
                    {u.id === user?.id && <span className="current-badge"> (Вы)</span>}
                    {u.isBanned && <span className="banned-badge"> Забанен</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge ${getRoleColor(u.role)}`}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${u.isBanned ? 'status-banned' : 'status-active'}`}>
                      {u.isBanned ? '🔒 Забанен' : '🟢 Активен'}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    {u.id !== user?.id && (
                      <>
                        <select 
                          value={u.role} 
                          onChange={(e) => changeRole(u.id, e.target.value, u.username)}
                          className="role-select"
                          disabled={u.isBanned}
                        >
                          <option value="user">👤 Пользователь</option>
                          <option value="moderator">🛡️ Модератор</option>
                          <option value="admin">👑 Администратор</option>
                        </select>
                        <button 
                          onClick={() => banUser(u.id, u.username, u.isBanned)}
                          className={`ban-user-btn ${u.isBanned ? 'unban' : 'ban'}`}
                          title={u.isBanned ? 'Разбанить' : 'Забанить'}
                        >
                          {u.isBanned ? '🔓' : '🔨'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManager;