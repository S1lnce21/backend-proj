import React, { createContext, useState, useContext, useEffect } from 'react';
import translations from '../locales';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ru');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.className = theme;
  }, [theme]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      theme,
      setTheme,
      notificationsEnabled,
      setNotificationsEnabled,
      soundEnabled,
      setSoundEnabled,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
};