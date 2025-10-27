import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import EditNoteIcon from '@mui/icons-material/EditNote';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import BarChartIcon from '@mui/icons-material/BarChart';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { useTheme } from '../contexts/ThemeContext';
import { useViewMode } from '../contexts/ViewModeContext';
import { fetchWithCache } from '../utils/cache';

const StatCard = ({ title, count, icon, color, gradient }) => {
  const { isDarkMode, theme } = useTheme();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        position: 'relative',
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '6px 6px 4px',
        borderRadius: '10px',
        border: isDarkMode ? '1px solid #415A77' : '1px solid #eef1f5',
        margin: '0 4px',
        background: isDarkMode 
          ? `linear-gradient(180deg, rgba(65,90,119,0.3) 0%, ${theme.palette.background.paper} 85%)`
          : `linear-gradient(180deg, ${color} 0%, #ffffff 85%)`,
        overflow: 'hidden',
        minWidth: '200px',
        minHeight: '64px',
        '&:first-of-type': { marginLeft: 0 },
        '&:last-of-type': { marginRight: 0 }
      }}
    >
      {/* bottom accent bar */}
      <Box sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '3px',
        borderBottomLeftRadius: '10px',
        borderBottomRightRadius: '10px',
        background: gradient
      }} />

      {/* Left: text */}
      <Box>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '12px', fontWeight: 500 }}>
          {title}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '18px', color: theme.palette.text.primary }}>
          {count}
        </Typography>
      </Box>

      {/* Right: icon */}
      <Box sx={{ 
        backgroundColor: color, 
        borderRadius: '50%', 
        width: '28px', 
        height: '28px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #e6e9ef'
      }}>
        {icon}
      </Box>
    </Paper>
  );
};

const SwitchCard = () => {
  const { isDarkMode, theme } = useTheme();
  const { viewMode, setViewMode } = useViewMode();
  const selected = viewMode;
  return (
    <Paper 
      elevation={0}
      sx={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '6px',
        borderRadius: '10px',
        border: isDarkMode ? '1px solid #415A77' : '1px solid #eef1f5',
        margin: '0 4px',
        background: isDarkMode 
          ? `linear-gradient(180deg, rgba(65,90,119,0.3) 0%, ${theme.palette.background.paper} 85%)`
          : 'linear-gradient(180deg, #e3f2fd 0%, #ffffff 85%)',
        overflow: 'hidden',
        minWidth: '200px',
        minHeight: '64px'
      }}
    >
      {/* bottom accent bar */}
      <Box sx={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '3px',
        borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px',
        background: 'linear-gradient(90deg, rgba(33,150,243,0.6), rgba(33,150,243,0.95))'
      }} />

      {/* Label */}
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '12px', fontWeight: 500 }}>
        View Mode
      </Typography>

      {/* Equal split toggles */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
        <Button
          onClick={() => setViewMode('analytics')}
          startIcon={<BarChartIcon />}
          sx={{
            width: '100%',
            fontSize: '12px',
            textTransform: 'none',
            borderRadius: '8px',
            padding: '4px 6px',
            border: isDarkMode ? '1px solid #415A77' : '1px solid #2e3a4d',
            color: selected === 'analytics' ? '#fff' : (isDarkMode ? theme.palette.text.primary : '#2e3a4d'),
            backgroundColor: selected === 'analytics' ? '#2196f3' : (isDarkMode ? theme.palette.background.paper : '#fff'),
            '&:hover': { backgroundColor: selected === 'analytics' ? '#1976d2' : (isDarkMode ? 'rgba(58,134,255,0.1)' : '#f7f9fc') }
          }}
          variant={selected === 'analytics' ? 'contained' : 'outlined'}
        >
          Analytics
        </Button>
        <Button
          onClick={() => setViewMode('ask')}
          startIcon={<QuestionAnswerIcon />}
          sx={{
            width: '100%',
            fontSize: '12px',
            textTransform: 'none',
            borderRadius: '8px',
            padding: '4px 6px',
            border: isDarkMode ? '1px solid #415A77' : '1px solid #2e3a4d',
            color: selected === 'ask' ? '#fff' : (isDarkMode ? theme.palette.text.primary : '#2e3a4d'),
            backgroundColor: selected === 'ask' ? '#2196f3' : (isDarkMode ? theme.palette.background.paper : '#fff'),
            '&:hover': { backgroundColor: selected === 'ask' ? '#1976d2' : (isDarkMode ? 'rgba(58,134,255,0.1)' : '#f7f9fc') }
          }}
          variant={selected === 'ask' ? 'contained' : 'outlined'}
        >
          Ask AI
        </Button>
      </Box>
    </Paper>
  );
};

const StatCards = () => {
  const [stats, setStats] = useState({
    totalPensioners: 0,
    totalDLC: 0,
    totalManual: 0,
    verifiedToday: 0,
    pendingQueue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false); // Guard against double-run in StrictMode

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // API call with cache (5 minutes TTL)
      const data = await fetchWithCache(
        'https://samar.iitk.ac.in/dlc-pension-data-api/api/dashboard/public-stats',
        {},
        5 * 60 * 1000 // 5 minutes cache
      );
      
      if (data.success) {
        setStats({
          totalPensioners: data.totalPensioners || 0,
          totalDLC: data.submissionStats?.totalDLC || 0,
          totalManual: data.submissionStats?.totalManual || 0,
          verifiedToday: data.verifiedToday || 0,
          pendingQueue: data.pendingQueue || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num.toLocaleString('en-IN');
  };

  // Show cards regardless; use placeholders when loading or error
  const display = (value) => (loading || error ? '—' : formatNumber(value));

  return (
    <Box className="stat-cards" sx={{ display: 'flex', gap: '8px', margin: '0px 0', flexWrap: 'nowrap', overflowX: 'auto' }}>
      <StatCard 
        title="Total Pensioners" 
        count={display(stats.totalPensioners)} 
        icon={<PersonIcon sx={{ color: '#2196f3', fontSize: 16 }} />} 
        color="#e3f2fd"
        gradient="linear-gradient(90deg, rgba(33,150,243,0.6), rgba(33,150,243,0.95))"
      />
      <StatCard 
        title="Total DLC" 
        count={display(stats.totalDLC)} 
        icon={<DescriptionIcon sx={{ color: '#9c27b0', fontSize: 16 }} />} 
        color="#f3e5f5"
        gradient="linear-gradient(90deg, rgba(156,39,176,0.6), rgba(156,39,176,0.95))"
      />
      <StatCard 
        title="Total Manual" 
        count={display(stats.totalManual)} 
        icon={<EditNoteIcon sx={{ color: '#3f51b5', fontSize: 16 }} />} 
        color="#e8eaf6"
        gradient="linear-gradient(90deg, rgba(63,81,181,0.6), rgba(63,81,181,0.95))"
      />
      <StatCard 
        title="Verified Today" 
        count={display(stats.verifiedToday)} 
        icon={<VerifiedIcon sx={{ color: '#4caf50', fontSize: 16 }} />} 
        color="#e8f5e9"
        gradient="linear-gradient(90deg, rgba(76,175,80,0.6), rgba(76,175,80,0.95))"
      />
      <StatCard 
        title="Pending Queue" 
        count={display(stats.pendingQueue)} 
        icon={<PendingActionsIcon sx={{ color: '#ff9800', fontSize: 16 }} />} 
        color="#fff3e0"
        gradient="linear-gradient(90deg, rgba(255,152,0,0.6), rgba(255,152,0,0.95))"
      />
      <SwitchCard />
    </Box>
  );
};

export default StatCards;