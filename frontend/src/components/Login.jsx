import React, { useState } from 'react';
import './styles/Auth.css';

const Login = ({ onSwitch, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(email, password);
    setLoading(false);
  };

  return (
    <main className="auth-container">
      <form onSubmit={handleSubmit} className="auth-box">
        <h2>Вход</h2>
        
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Введите email"
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Пароль:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Введите пароль"
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          className="auth-button"
          disabled={loading}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
        
        <p className="auth-switch">
          Нет аккаунта?{' '}
          <button 
            onClick={onSwitch} 
            className="switch-button"
            type="button"
            disabled={loading}
          >
            Зарегистрироваться
          </button>
        </p>
      </form>
    </main>
  );
};

export default Login;