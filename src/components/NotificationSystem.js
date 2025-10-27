import React, { useState } from 'react';
import { Box, Typography, Popover, CircularProgress, Divider } from '@mui/material';

// Loading animation component for notifications
const NotificationLoading = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px',
      width: '100%'
    }}>
      <CircularProgress size={24} color="primary" />
      <Typography variant="body2" sx={{ ml: 2, fontSize: '14px' }}>
        Loading notifications...
      </Typography>
    </Box>
  );
};

// Notification item component
const NotificationItem = ({ dot = true, content = "---", subContent = "---", subContent2 = "---" }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'flex-start', 
      padding: '12px 16px',
      borderBottom: '1px solid',
      borderColor: 'divider',
      '&:last-child': {
        borderBottom: 'none'
      }
    }}>
      {dot && (
        <Box sx={{ 
          mt: 0.8,
          mr: 1.5,
          width: 8, 
          height: 8, 
          borderRadius: '50%', 
          backgroundColor: 'primary.main',
          flexShrink: 0
        }} />
      )}
      <Box sx={{ width: '100%' }}>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          {content}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px', mb: 0.5 }}>
          {subContent}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>
          {subContent2}
        </Typography>
      </Box>
    </Box>
  );
};

// Main notification system component
const NotificationSystem = ({ anchorEl, open, handleClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading for 1 second
  React.useEffect(() => {
    if (open) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
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
          width: 320,
          maxHeight: 400,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 16px',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Notifications
        </Typography>
      </Box>

      {isLoading ? (
        <NotificationLoading />
      ) : (
        <Box sx={{ maxHeight: 340, overflowY: 'auto' }}>
          <NotificationItem 
            content="---" 
            subContent="---" 
            subContent2="---" 
          />
          <Divider />
          <NotificationItem 
            content="---" 
            subContent="---" 
            subContent2="---" 
          />
          <Divider />
          <NotificationItem 
            content="---" 
            subContent="---" 
            subContent2="---" 
          />
          <Box sx={{ 
            padding: '10px 16px', 
            textAlign: 'center', 
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'primary.main', 
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
              onClick={handleClose}
            >
              View All
            </Typography>
          </Box>
        </Box>
      )}
    </Popover>
  );
};

export default NotificationSystem;