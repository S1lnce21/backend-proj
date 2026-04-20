import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import '../styles/Auth.css';

const Login = ({ onSwitch, onLogin }) => {
  const { t, theme, setTheme, language, setLanguage } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(email, password);
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-decorative">
        <div className="decorative-shape shape-1"></div>
        <div className="decorative-shape shape-2"></div>
        <div className="decorative-shape shape-3"></div>
        <div className="decorative-content">
          <div className="decorative-icon">💬</div>
          <h3>{t('chatWithFriends') || 'Чат с друзьями'}</h3>
          <p>{t('chatDescription') || 'Общайтесь в реальном времени'}</p>
          <div className="decorative-features">
            <span>📝 {t('createPosts') || 'Создавайте посты'}</span>
            <span>📰 {t('readNews') || 'Читайте новости'}</span>
            <span>🛍️ {t('manageProducts') || 'Управляйте товарами'}</span>
          </div>
        </div>
      </div>

      <div className={`auth-container ${theme}`}>
        <div className="auth-settings">
          <button 
            className="settings-btn" 
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            title={t('selectTheme') || 'Выбрать тему'}
          >
            🎨
          </button>
          <button 
            className="settings-btn" 
            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            title={t('selectLanguage') || 'Выбрать язык'}
          >
            🌐
          </button>
          
          {showThemeSelector && (
            <div className="settings-dropdown">
              <button className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => { setTheme('light'); setShowThemeSelector(false); }}>
                ☀️ {t('lightTheme')}
              </button>
              <button className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => { setTheme('dark'); setShowThemeSelector(false); }}>
                🌙 {t('darkTheme')}
              </button>
            </div>
          )}
          
          {showLanguageSelector && (
            <div className="settings-dropdown">
              <button className={`lang-option ${language === 'ru' ? 'active' : ''}`} onClick={() => { setLanguage('ru'); setShowLanguageSelector(false); }}>
                🇷🇺 {t('russian')}
              </button>
              <button className={`lang-option ${language === 'en' ? 'active' : ''}`} onClick={() => { setLanguage('en'); setShowLanguageSelector(false); }}>
                🇬🇧 {t('english')}
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="auth-box">
          <div className="auth-logo">✨</div>
          <h2>{t('welcomeBack')}</h2>
          <p className="auth-subtitle">{t('loginSubtitle')}</p>
          
          <div className="form-group">
            <label>{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('enterEmail')}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t('enterPassword')}
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '...' : t('login')}
          </button>
          
          <p className="auth-switch">
            {t('noAccount')}{' '}
            <button onClick={onSwitch} className="switch-button" type="button" disabled={loading}>
              {t('register')}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;