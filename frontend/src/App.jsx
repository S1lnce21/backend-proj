import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/dashboard';
import SupportChat from './components/SupportChat';
import { authAPI } from './services/api';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
    } catch (error) {
      console.error('Ошибка проверки аутентификации:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    setError('');
    try {
      const response = await authAPI.login({ email, password });
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при входе');
    }
  };

  const handleRegister = async (username, email, password) => {
    setError('');
    try {
      const response = await authAPI.register({ username, email, password });
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при регистрации');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsLogin(true);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  if (user) {
    return (
      <>
        <Dashboard user={user} onLogout={handleLogout} />
        <SupportChat />
      </>
    );
  }

  return (
    <div className="container">
      {error && <div className="error-message">{error}</div>}
      {isLogin ? (
        <Login 
          onSwitch={() => setIsLogin(false)} 
          onLogin={handleLogin}
        />
      ) : (
        <Register 
          onSwitch={() => setIsLogin(true)} 
          onRegister={handleRegister}
        />
      )}
      <SupportChat />
    </div>
  );
}

export default App;