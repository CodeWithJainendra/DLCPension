import React from 'react';
import { Paper, Box, Typography, TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useTheme } from '../contexts/ThemeContext';

// Simple custom AI brand logo (theme-colored via currentColor)
const AIBrandLogo = () => (
  <Box component="span" sx={{ width: 22, height: 22, display: 'inline-flex' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 12c1.8-2.2 4.2-3.3 7-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M7.5 15c2.5 1.5 5.5 1.6 9 .3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="9" cy="10" r="1.2" fill="currentColor" />
      <circle cx="15" cy="9" r="1.2" fill="currentColor" />
      <circle cx="14" cy="15" r="1.2" fill="currentColor" />
      <path d="M18 6l.7 1.5L20.2 8l-1.5.7L18 10l-.7-1.3L15.8 8l1.5-.5L18 6z" fill="currentColor" opacity="0.9" />
    </svg>
  </Box>
);

const AIChatCard = () => {
  const { isDarkMode, theme } = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        border: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea',
        backgroundColor: theme.palette.background.paper,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '10px', 
        padding: '10px', 
        borderBottom: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea',
        textAlign: 'center',
        color: isDarkMode ? theme.palette.info.main : theme.palette.primary.main
      }}>
        <AIBrandLogo />
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px', color: theme.palette.text.primary, lineHeight: 1 }}>
            AI Assistant
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
            Powered by Advanced AI
          </Typography>
        </Box>
      </Box>

      {/* Messages area */}
      <Box sx={{ flex: 1, minHeight: 0, padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Box sx={{ alignSelf: 'flex-start', backgroundColor: isDarkMode ? '#25324a' : '#f4f7fb', color: theme.palette.text.primary, borderRadius: '8px', padding: '8px 10px', maxWidth: '80%', border: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea' }}>
          <Typography variant="body2" sx={{ fontSize: '12px' }}>
            Hello! I’m your AI assistant. How can I help you today?
          </Typography>
        </Box>
      </Box>

      {/* Input */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderTop: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea' }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Ask me anything about DLC Pension System..."
          InputProps={{ sx: { fontSize: '12px' } }}
        />
        <IconButton color="primary" size="small">
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default AIChatCard;