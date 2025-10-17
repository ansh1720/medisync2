import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Check localStorage first
        const savedTheme = localStorage.getItem('medisync-theme');
        
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setTheme(savedTheme);
        } else {
          // Fall back to system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const systemTheme = prefersDark ? 'dark' : 'light';
          setTheme(systemTheme);
          localStorage.setItem('medisync-theme', systemTheme);
        }
      } catch (error) {
        console.warn('Error accessing localStorage for theme:', error);
        setTheme('light'); // Safe fallback
      }
      setIsLoading(false);
    };

    initializeTheme();
  }, []);

  // Apply theme to document root and save to localStorage
  useEffect(() => {
    if (!isLoading) {
      document.documentElement.setAttribute('data-theme', theme);
      
      try {
        localStorage.setItem('medisync-theme', theme);
      } catch (error) {
        console.warn('Error saving theme to localStorage:', error);
      }
    }
  }, [theme, isLoading]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      // Only auto-update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('medisync-theme');
      if (!savedTheme) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const setThemeMode = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
    }
  };

  const getThemeColors = () => {
    return {
      background: theme === 'dark' ? '#111827' : '#ffffff',
      foreground: theme === 'dark' ? '#ffffff' : '#111827',
      card: theme === 'dark' ? '#1f2937' : '#ffffff',
      cardForeground: theme === 'dark' ? '#f9fafb' : '#111827',
      primary: theme === 'dark' ? '#3b82f6' : '#2563eb',
      primaryForeground: '#ffffff',
      secondary: theme === 'dark' ? '#374151' : '#f3f4f6',
      secondaryForeground: theme === 'dark' ? '#d1d5db' : '#374151',
      muted: theme === 'dark' ? '#374151' : '#f9fafb',
      mutedForeground: theme === 'dark' ? '#9ca3af' : '#6b7280',
      accent: theme === 'dark' ? '#1f2937' : '#f1f5f9',
      accentForeground: theme === 'dark' ? '#f9fafb' : '#0f172a',
      border: theme === 'dark' ? '#374151' : '#e5e7eb',
      input: theme === 'dark' ? '#374151' : '#ffffff',
      ring: theme === 'dark' ? '#3b82f6' : '#2563eb',
    };
  };

  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeMode,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    getThemeColors,
    isLoading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;