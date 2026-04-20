import React, { useState } from 'react';
import { authAPI } from '../services/api';
import './styles/UserMenu.css';

const UserMenu = ({ user, onLogout, onUpdateUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    username: user?.username || '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = newTheme;
    setMessage(`Тема изменена на ${newTheme === 'light' ? 'светлую' : 'темную'}`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (settings.newPassword && settings.newPassword !== settings.confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }
    
    if (settings.newPassword && settings.newPassword.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    
    try {
      const updateData = {
        username: settings.username,
        ...(settings.password && { currentPassword: settings.password }),
        ...(settings.newPassword && { newPassword: settings.newPassword })
      };
      
      const response = await authAPI.updateProfile(updateData);
      if (response.data.user) {
        onUpdateUser(response.data.user);
        setMessage('Профиль успешно обновлен');
        setSettings({ ...settings, password: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при обновлении профиля');
    }
  };

  return (
    <>
      <button className="user-menu-btn" onClick={() => setIsOpen(!isOpen)}>
        👤 {user?.username}
      </button>

      {isOpen && (
        <div className="user-menu-modal">
          <div className="user-menu-header">
            <h3>Аккаунт</h3>
            <button className="close-menu-btn" onClick={() => setIsOpen(false)}>✖</button>
          </div>

          <div className="user-menu-tabs">
            <button className={`menu-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
              👤 Профиль
            </button>
            <button className={`menu-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              ⚙️ Настройки
            </button>
            <button className={`menu-tab ${activeTab === 'theme' ? 'active' : ''}`} onClick={() => setActiveTab('theme')}>
              🎨 Тема
            </button>
          </div>

          <div className="user-menu-content">
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={user?.email} disabled className="disabled-input" />
                </div>
                <div className="form-group">
                  <label>Имя пользователя</label>
                  <input type="text" value={settings.username} onChange={(e) => setSettings({ ...settings, username: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Текущий пароль (для смены)</label>
                  <input type="password" value={settings.password} onChange={(e) => setSettings({ ...settings, password: e.target.value })} placeholder="Введите текущий пароль" />
                </div>
                <div className="form-group">
                  <label>Новый пароль</label>
                  <input type="password" value={settings.newPassword} onChange={(e) => setSettings({ ...settings, newPassword: e.target.value })} placeholder="Введите новый пароль" />
                </div>
                <div className="form-group">
                  <label>Подтверждение пароля</label>
                  <input type="password" value={settings.confirmPassword} onChange={(e) => setSettings({ ...settings, confirmPassword: e.target.value })} placeholder="Подтвердите новый пароль" />
                </div>
                {error && <div className="error-msg">{error}</div>}
                {message && <div className="success-msg">{message}</div>}
                <button type="submit" className="save-btn">Сохранить изменения</button>
                <button type="button" className="logout-btn" onClick={onLogout}>🚪 Выйти из аккаунта</button>
              </form>
            )}

            {activeTab === 'settings' && (
              <div className="settings-panel">
                <div className="setting-item">
                  <label>Язык</label>
                  <select value="ru" disabled>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Уведомления</label>
                  <div className="toggle-switch">
                    <input type="checkbox" id="notifications" defaultChecked />
                    <label htmlFor="notifications">Включить уведомления</label>
                  </div>
                </div>
                <div className="setting-item">
                  <label>Звук уведомлений</label>
                  <div className="toggle-switch">
                    <input type="checkbox" id="sound" defaultChecked />
                    <label htmlFor="sound">Включить звук</label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="theme-panel">
                <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => handleThemeChange('light')}>
                  ☀️ Светлая тема
                </button>
                <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => handleThemeChange('dark')}>
                  🌙 Темная тема
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UserMenu;