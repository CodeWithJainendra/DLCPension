import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, login } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#000',
        }}
      >
        <CircularProgress sx={{ color: '#29a071' }} size={60} />
      </Box>
    );
  }

  // If not authenticated, show login page with login function
  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  // If authenticated, render the protected content (Dashboard)
  return children;
};

export default ProtectedRoute;
