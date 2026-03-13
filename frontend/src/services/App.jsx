import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/dashboard';
import { authAPI } from './services/api';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleRegister = (userData) => {
    setUser(userData);
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

  const handleSwitch = () => {
    setIsLogin(!isLogin);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="container">
      {isLogin ? (
        <Login onSwitch={handleSwitch} onLogin={handleLogin} />
      ) : (
        <Register onSwitch={handleSwitch} onRegister={handleRegister} />
      )}
    </div>
  );
}

export default App;