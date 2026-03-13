import React, { useState } from 'react';
import { authAPI } from '../services/api';
import './Auth.css';

const Register = ({ onSwitch, onRegister }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      await authAPI.register({ username, email, password });
      
      const loginResponse = await authAPI.login({ email, password });
      const { token, user } = loginResponse.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      if (onRegister) {
        onRegister(user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <form onSubmit={handleSubmit} className="auth-box">
        <h2>Регистрация</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Введите email"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Имя пользователя:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength="3"
            placeholder="Введите имя (мин. 3 символа)"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
            placeholder="Введите пароль (мин. 6 символов)"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Подтверждение пароля:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Подтвердите пароль"
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          className="auth-button"
          disabled={loading}
        >
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
        
        <p className="auth-switch">
          Уже есть аккаунт?{' '}
          <button 
            onClick={onSwitch} 
            className="switch-button"
            type="button"
            disabled={loading}
          >
            Войти
          </button>
        </p>
      </form>
    </main>
  );
};

export default Register;