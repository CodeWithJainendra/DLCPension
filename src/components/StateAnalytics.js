import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BusinessIcon from '@mui/icons-material/Business';
import { useTheme } from '../contexts/ThemeContext';

const StateAnalytics = () => {
  const [tabValue, setTabValue] = useState(0);
  const { isDarkMode, theme } = useTheme();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Paper elevation={0} sx={{ 
      padding: '10px', 
      borderRadius: '8px',
      border: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea',
      marginBottom: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.palette.background.paper
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>
          STATE ANALYTICS
        </Typography>
        <Typography
          variant="body2"
          sx={{ 
            fontSize: '12px', 
            fontFamily: 'Inter, Roboto, Arial, sans-serif', 
            color: theme.palette.primary.main, 
            cursor: 'pointer'
          }}
        >
          Show more
        </Typography>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: isDarkMode ? '#415A77' : 'divider' }}>
        <Box sx={{ mb: '4px' }}>
          <Box sx={{
            backgroundColor: isDarkMode ? theme.palette.background.paper : '#f5f6f8',
            border: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="state analytics tabs"
              variant="fullWidth"
              textColor="inherit"
              sx={{
                minHeight: 0,
                '& .MuiTabs-indicator': { backgroundColor: theme.palette.primary.main, height: '2px' }
              }}
            >
              <Tab 
                icon={<LocationCityIcon fontSize="small" />} 
                iconPosition="start"
                label="Top States" 
                disableRipple
                sx={{ 
                  textTransform: 'none', 
                  fontSize: '11px',
                  minHeight: '28px',
                  padding: '0 10px',
                  fontFamily: 'Inter, Roboto, Arial, sans-serif',
                  backgroundColor: isDarkMode ? theme.palette.background.default : '#f3f5f7',
                  color: theme.palette.text.secondary,
                  '&.Mui-selected': { backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff', color: theme.palette.primary.main },
                  '&:not(:last-of-type)': { borderRight: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea' }
                }} 
              />
              <Tab 
                icon={<AccountBalanceIcon fontSize="small" />} 
                iconPosition="start"
                label="Top Banks" 
                disableRipple
                sx={{ 
                  textTransform: 'none', 
                  fontSize: '11px',
                  minHeight: '28px',
                  padding: '0 10px',
                  fontFamily: 'Inter, Roboto, Arial, sans-serif',
                  backgroundColor: isDarkMode ? theme.palette.background.default : '#f3f5f7',
                  color: theme.palette.text.secondary,
                  '&.Mui-selected': { backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff', color: theme.palette.primary.main },
                  '&:not(:last-of-type)': { borderRight: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea' }
                }} 
              />
              <Tab 
                icon={<BusinessIcon fontSize="small" />} 
                iconPosition="start"
                label="Top PSAs" 
                disableRipple
                sx={{ 
                  textTransform: 'none', 
                  fontSize: '11px',
                  minHeight: '28px',
                  padding: '0 10px',
                  fontFamily: 'Inter, Roboto, Arial, sans-serif',
                  backgroundColor: isDarkMode ? theme.palette.background.default : '#f3f5f7',
                  color: theme.palette.text.secondary,
                  '&.Mui-selected': { backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff', color: theme.palette.primary.main }
                }} 
              />
            </Tabs>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ padding: '4px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {tabValue === 0 && (
          <Box>
            {[1, 2, 3, 4, 5, 6, 7].map((item) => (
              <Box 
                key={item}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '3px 0',
                  borderBottom: item < 7 ? (isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea') : 'none'
                }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>{item}. ---</Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>---</Typography>
              </Box>
            ))}
          </Box>
        )}
        
        {tabValue === 1 && (
          <Box>
            {[1, 2, 3, 4, 5, 6, 7].map((item) => (
              <Box 
                key={item}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '3px 0',
                  borderBottom: item < 7 ? (isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea') : 'none'
                }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>{item}. ---</Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>---</Typography>
              </Box>
            ))}
          </Box>
        )}
        
        {tabValue === 2 && (
          <Box>
            {[1, 2, 3, 4, 5, 6, 7].map((item) => (
              <Box 
                key={item}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '3px 0',
                  borderBottom: item < 7 ? (isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea') : 'none'
                }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>{item}. ---</Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>---</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      

    </Paper>
  );
};

export default StateAnalytics;