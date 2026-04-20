import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import './styles/UserMenu.css';

const UserMenu = ({ user, onLogout, onUpdateUser }) => {
  const { t, language, setLanguage, theme, setTheme, notificationsEnabled, setNotificationsEnabled, soundEnabled, setSoundEnabled } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    username: user?.username || '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setMessage(t('themeChanged'));
    setTimeout(() => setMessage(''), 3000);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setMessage(t('languageChanged'));
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    if (settings.newPassword && settings.newPassword !== settings.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      setLoading(false);
      return;
    }
    
    if (settings.newPassword && settings.newPassword.length < 6) {
      setError(t('passwordMinLength'));
      setLoading(false);
      return;
    }
    
    try {
      const updateData = {
        username: settings.username,
      };
      
      if (settings.password) {
        updateData.currentPassword = settings.password;
      }
      
      if (settings.newPassword) {
        updateData.newPassword = settings.newPassword;
      }
      
      const response = await authAPI.updateProfile(updateData);
      
      if (response.data.user) {
        onUpdateUser(response.data.user);
        setMessage(t('profileUpdated'));
        setSettings({ 
          username: response.data.user.username,
          password: '', 
          newPassword: '', 
          confirmPassword: '' 
        });
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || t('updateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-menu-container">
      <button className="user-menu-btn" onClick={() => setIsOpen(!isOpen)}>
        👤 {user?.username}
      </button>

      {isOpen && (
        <div className={`user-menu-dropdown ${theme}`}>
          <div className="user-menu-header">
            <h3>{t('account')}</h3>
            <button className="close-menu-btn" onClick={() => setIsOpen(false)}>✖</button>
          </div>

          <div className="user-menu-tabs">
            <button className={`menu-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
              👤 {t('profile')}
            </button>
            <button className={`menu-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              ⚙️ {t('settings')}
            </button>
            <button className={`menu-tab ${activeTab === 'theme' ? 'active' : ''}`} onClick={() => setActiveTab('theme')}>
              🎨 {t('theme')}
            </button>
          </div>

          <div className="user-menu-content">
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label>{t('email')}</label>
                  <input type="email" value={user?.email} disabled className="disabled-input" />
                </div>
                <div className="form-group">
                  <label>{t('username')}</label>
                  <input 
                    type="text" 
                    value={settings.username} 
                    onChange={(e) => setSettings({ ...settings, username: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>{t('currentPassword')}</label>
                  <input 
                    type="password" 
                    value={settings.password} 
                    onChange={(e) => setSettings({ ...settings, password: e.target.value })} 
                    placeholder={t('currentPassword')}
                    autoComplete="off"
                  />
                </div>
                <div className="form-group">
                  <label>{t('newPassword')}</label>
                  <input 
                    type="password" 
                    value={settings.newPassword} 
                    onChange={(e) => setSettings({ ...settings, newPassword: e.target.value })} 
                    placeholder={t('newPassword')}
                    autoComplete="off"
                  />
                </div>
                <div className="form-group">
                  <label>{t('confirmPassword')}</label>
                  <input 
                    type="password" 
                    value={settings.confirmPassword} 
                    onChange={(e) => setSettings({ ...settings, confirmPassword: e.target.value })} 
                    placeholder={t('confirmPassword')}
                    autoComplete="off"
                  />
                </div>
                {error && <div className="error-msg">{error}</div>}
                {message && <div className="success-msg">{message}</div>}
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? '...' : t('saveChanges')}
                </button>
                <button type="button" className="logout-btn" onClick={onLogout}>
                  {t('logoutAccount')}
                </button>
              </form>
            )}

            {activeTab === 'settings' && (
              <div className="settings-panel">
                <div className="setting-item">
                  <label>{t('language')}</label>
                  <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
                    <option value="ru">{t('russian')}</option>
                    <option value="en">{t('english')}</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>{t('notificationsToggle')}</label>
                  <div className="toggle-switch">
                    <input type="checkbox" id="notifications" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} />
                    <label htmlFor="notifications">{notificationsEnabled ? t('on') : t('off')}</label>
                  </div>
                </div>
                <div className="setting-item">
                  <label>{t('soundToggle')}</label>
                  <div className="toggle-switch">
                    <input type="checkbox" id="sound" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
                    <label htmlFor="sound">{soundEnabled ? t('on') : t('off')}</label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="theme-panel">
                <button 
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`} 
                  onClick={() => handleThemeChange('light')}
                >
                  ☀️ {t('lightTheme')}
                </button>
                <button 
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} 
                  onClick={() => handleThemeChange('dark')}
                >
                  🌙 {t('darkTheme')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;