import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }
  return context;
};

export const ThemeContextProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // Set initial theme attribute
  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#2A9D8F', // Green success
      },
      background: {
        default: '#f5f7fa',
        paper: '#ffffff',
      },
      text: {
        primary: '#2b2e3a',
        secondary: '#666666',
      },
      warning: {
        main: '#FCA311', // Accent orange
      },
      info: {
        main: '#3A86FF', // Button highlight
      },
    },
  });

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#3A86FF', // Button highlight blue
      },
      secondary: {
        main: '#2A9D8F', // Green success
      },
      background: {
        default: '#0D1B2A', // Deep navy blue
        paper: '#1B263B', // Slightly lighter navy tone
      },
      text: {
        primary: '#E0E1DD', // Light text
        secondary: '#415A77', // Border/divider color for secondary text
      },
      warning: {
        main: '#FCA311', // Accent orange
      },
      info: {
        main: '#3A86FF', // Button highlight
      },
      error: {
        main: '#9C4522', // Warning/header highlight
      },
      success: {
        main: '#2A9D8F', // Green success
      },
      // Custom colors for specific use cases
      custom: {
        purple: '#6C63FF', // Purple accent for Total DLC
        orange: '#FCA311', // Accent orange
        navy: '#1B263B', // Card background
        border: '#415A77', // Border/divider
      },
    },
  });

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};