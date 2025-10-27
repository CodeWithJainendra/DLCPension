import React, { useState } from 'react';
import { Box, Typography, Avatar, IconButton, Badge, Menu, MenuItem, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationSystem from './NotificationSystem';

const Header = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { logout } = useAuth();
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  
  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleUserMenuClick = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleSettingsClick = () => {
    // Handle settings click
    handleUserMenuClose();
  };

  const handleLogoutClick = () => {
    // Call logout function from AuthContext
    logout();
    handleUserMenuClose();
    // The ProtectedRoute component will automatically redirect to login
  };

  const notificationOpen = Boolean(notificationAnchorEl);
  const userMenuOpen = Boolean(userMenuAnchorEl);
  
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '10px 20px',
      borderBottom: `1px solid ${isDarkMode ? '#415A77' : '#eaeaea'}`,
      backgroundColor: theme.palette.background.paper
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src="/Images/mainlogo.png" 
          alt="Main Logo" 
          style={{ height: '40px', marginRight: '15px' }} 
        />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: isDarkMode ? '#3A86FF' : '#1a237e', fontSize: '16px' }}>
            DOPPW DLC Pensioner Management System
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '12px' }}>
            Digital Life Certificate Pension Management
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ 
          backgroundColor: isDarkMode ? 'rgba(156,69,34,0.2)' : '#fff8e1', 
          padding: '5px 15px', 
          borderRadius: '4px',
          marginRight: '15px',
          display: 'flex',
          alignItems: 'center',
          border: isDarkMode ? '1px solid #9C4522' : 'none'
        }}>
          <Typography variant="body2" sx={{ color: isDarkMode ? '#9C4522' : '#ff6d00', fontSize: '12px', marginRight: '5px' }}>
            Next Data Update
          </Typography>
          <Typography variant="body1" sx={{ color: isDarkMode ? '#9C4522' : '#ff6d00', fontWeight: 'bold', fontSize: '14px' }}>
            17:16:55
          </Typography>
        </Box>
        
        <IconButton 
          onClick={toggleTheme}
          sx={{ 
            marginRight: '10px',
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(58,134,255,0.1)' : 'rgba(0,0,0,0.04)'
            }
          }}
        >
          {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
        
        <IconButton 
          onClick={handleNotificationClick}
          sx={{ 
            marginRight: '15px', 
            position: 'relative',
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(58,134,255,0.1)' : 'rgba(0,0,0,0.04)'
            }
          }}
        >
          <Badge
            variant="dot"
            color="error"
            overlap="circular"
            badgeContent=" "
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
        
        {/* Notification System */}
        <NotificationSystem 
          anchorEl={notificationAnchorEl} 
          open={notificationOpen} 
          handleClose={handleNotificationClose} 
        />
        
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={handleUserMenuClick}
        >
          <Avatar sx={{ bgcolor: '#3f51b5', width: 32, height: 32, fontSize: '14px' }}>A</Avatar>
          <Box sx={{ marginLeft: '10px', textAlign: 'left' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '14px', color: theme.palette.text.primary }}>
              Admin User
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '12px' }}>
              Administrator
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            sx={{ 
              ml: 0.5, 
              p: 0.2,
              color: theme.palette.text.secondary
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        </Box>
        
        {/* User Menu */}
        <Menu
          anchorEl={userMenuAnchorEl}
          open={userMenuOpen}
          onClose={handleUserMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 180,
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1,
                fontSize: '14px',
                borderRadius: '4px',
                mx: 0.5,
                my: 0.25
              },
            }
          }}
        >
          <MenuItem onClick={handleSettingsClick} sx={{ color: theme.palette.text.primary }}>
            <SettingsIcon fontSize="small" sx={{ mr: 1.5 }} />
            Settings
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={handleLogoutClick} sx={{ color: theme.palette.error.main }}>
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Header;