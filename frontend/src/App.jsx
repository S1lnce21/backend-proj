import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/dashboard';
import RealChat from './components/RealChat';
import { AppProvider } from './context/AppContext';
import { authAPI } from './services/api';
import './App.css';

function AppContent() {
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
      console.error('Auth check error:', error);
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
      setError(err.response?.data?.error || 'Login error');
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
      setError(err.response?.data?.error || 'Registration error');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsLogin(true);
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  if (user) {
    return (
      <>
        <Dashboard user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
        <RealChat user={user} />
      </>
    );
  }

  return (
    <div className="container">
      {error && <div className="error-message">{error}</div>}
      {isLogin ? (
        <Login onSwitch={() => setIsLogin(false)} onLogin={handleLogin} />
      ) : (
        <Register onSwitch={() => setIsLogin(true)} onRegister={handleRegister} />
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;