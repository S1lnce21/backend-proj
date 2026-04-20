import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import '../styles/Auth.css';

const Register = ({ onSwitch, onRegister }) => {
  const { t, theme, setTheme, language, setLanguage } = useApp();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError(t('passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      setLocalError(t('passwordMinLength'));
      return;
    }

    setLoading(true);
    await onRegister(username, email, password);
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-decorative">
        <div className="decorative-shape shape-1"></div>
        <div className="decorative-shape shape-2"></div>
        <div className="decorative-shape shape-3"></div>
        <div className="decorative-content">
          <div className="decorative-icon">🚀</div>
          <h3>{t('joinUs') || 'Присоединяйтесь!'}</h3>
          <p>{t('joinDescription') || 'Создайте аккаунт и начните общение'}</p>
          <div className="decorative-features">
            <span>✨ {t('free') || 'Бесплатно'}</span>
            <span>🔒 {t('secure') || 'Безопасно'}</span>
            <span>💬 {t('convenient') || 'Удобно'}</span>
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
          <h2>{t('createAccount')}</h2>
          <p className="auth-subtitle">{t('registerSubtitle')}</p>
          
          {localError && <div className="error-message">{localError}</div>}
          
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
            <label>{t('username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength="3"
              placeholder={t('enterUsername')}
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
              minLength="6"
              placeholder={t('enterPassword')}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>{t('confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder={t('confirmPassword')}
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '...' : t('register')}
          </button>
          
          <p className="auth-switch">
            {t('haveAccount')}{' '}
            <button onClick={onSwitch} className="switch-button" type="button" disabled={loading}>
              {t('login')}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;