import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import cacheManager from '../utils/cache';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const hasChecked = useRef(false);

  // Check authentication status on mount
  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      console.log('🔄 AuthProvider mounted, checking auth...');
      checkAuthStatus();
    }
  }, []);

  const checkAuthStatus = () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      const isLoggedInCookie = document.cookie.includes('isLoggedIn=true');

      console.log('🔍 Checking auth status:', {
        hasToken: !!authToken,
        hasCookie: isLoggedInCookie,
        hasUser: !!userStr
      });

      if (authToken && isLoggedInCookie && userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ User authenticated:', userData.username);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        console.log('❌ User not authenticated - Missing:', {
          token: !authToken,
          cookie: !isLoggedInCookie,
          user: !userStr
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData) => {
    try {
      console.log('🔐 Login called with:', userData);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', userData.token || 'demo-token-' + Date.now());
      
      // Set cookies
      document.cookie = `username=${userData.username}; path=/; max-age=86400`;
      document.cookie = `isLoggedIn=true; path=/; max-age=86400`;
      document.cookie = `auth_token=${userData.token || 'demo-token-' + Date.now()}; path=/; max-age=86400`;

      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('✅ Login successful:', userData.username);
      console.log('📦 Stored in localStorage:', {
        user: localStorage.getItem('user'),
        token: localStorage.getItem('authToken'),
        cookie: document.cookie
      });
      
      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  const logout = () => {
    try {
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      
      // Clear cookies
      document.cookie = 'username=; path=/; max-age=0';
      document.cookie = 'isLoggedIn=; path=/; max-age=0';
      document.cookie = 'auth_token=; path=/; max-age=0';

      // Clear all API cache
      cacheManager.clear();

      setUser(null);
      setIsAuthenticated(false);
      
      console.log('✅ Logout successful - All cache cleared');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
