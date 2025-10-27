import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloseIcon from '@mui/icons-material/Close';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useTheme } from '../contexts/ThemeContext';
import { fetchWithCache } from '../utils/cache';

ChartJS.register(ArcElement, Tooltip, Legend);

// Faint double rings around the donut for a classic infographic feel
const outerRingsPlugin = {
  id: 'outerRings',
  afterDraw: (chart) => {
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || meta.data.length === 0) return;
    const { x, y, outerRadius } = meta.data[0];
    const ctx = chart.ctx;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.arc(x, y, outerRadius + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.beginPath();
    ctx.arc(x, y, outerRadius + 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },
};

const AgeBreakdown = () => {
  const { isDarkMode, theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [ageData, setAgeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false); // Guard against double-run in StrictMode

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAgeDistribution();
  }, []);

  const fetchAgeDistribution = async () => {
    try {
      setLoading(true);
      setError(null);

      // API call with cache (5 minutes TTL)
      const apiData = await fetchWithCache(
        'https://samar.iitk.ac.in/dlc-pension-data-api/api/dashboard/public-stats',
        {},
        5 * 60 * 1000 // 5 minutes cache
      );
      
      if (apiData.success && apiData.ageDistribution) {
        setAgeData(apiData.ageDistribution);
      }
    } catch (err) {
      console.error('❌ Failed to fetch age distribution:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data with fallback zeros when unavailable
  const fallbackLabels = ['<50', '50-60', '60-70', '70-80', '>80'];
  const hasData = ageData.length > 0;
  const data = {
    labels: hasData ? ageData.map(item => item.ageGroup) : fallbackLabels,
    datasets: [
      {
        data: hasData ? ageData.map(item => item.count) : [0, 0, 0, 0, 0],
        backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'],
        borderWidth: 0,
        hoverOffset: 2,
        spacing: 3,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    cutout: '68%',
    maintainAspectRatio: false,
  };

  // Always render the card; show placeholders when loading/error
  return (
    <>
      <Paper
        elevation={0}
        onClick={() => setOpen(true)}
        sx={{
          padding: '10px',
          borderRadius: '8px',
          border: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea',
          marginBottom: 0,
          minHeight: '132px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          backgroundColor: theme.palette.background.paper,
          '&:hover': {
            borderColor: isDarkMode ? '#3A86FF' : '#2196f3',
            boxShadow: isDarkMode ? '0 0 0 2px rgba(58,134,255,0.12)' : '0 0 0 2px rgba(33,150,243,0.12)'
          },
          '&:hover .hoverLabel': {
            opacity: 1,
            transform: 'translateY(0)'
          }
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Inter, Roboto, Arial, sans-serif', marginBottom: '19px', display: 'flex', alignItems: 'center', gap: '8px', color: theme.palette.text.primary }}>
          AGE-WISE BREAKDOWN
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, minHeight: 0 }}>
          {/* Left list - Dynamic data from API or placeholders */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(hasData ? ageData.slice(0, 4) : [0,1,2,3].map(i => ({ ageGroup: fallbackLabels[i], count: null }))).map((item, index) => {
              const colors = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];
              
              return (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '180px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '10px', height: '10px', backgroundColor: colors[index], borderRadius: '50%', marginRight: '8px' }} />
                    <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>
                      {item.ageGroup}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>
                    {item.count == null ? '—' : item.count.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Right segmented donut chart with center icon */}
          <Box sx={{ width: '76px', height: '60px', position: 'relative' }}>
            <Doughnut data={data} options={options} plugins={[outerRingsPlugin]} />
            <PeopleAltOutlinedIcon sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '16px', color: '#607d8b' }} />
          </Box>
        </Box>
        <Box
          className="hoverLabel"
          sx={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #90caf9',
            color: '#1976d2',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '11px',
            fontFamily: 'Inter, Roboto, Arial, sans-serif',
            opacity: 0,
            transition: 'opacity 0.15s ease, transform 0.15s ease',
            transform: 'translateY(-2px)',
            pointerEvents: 'none'
          }}
        >
          {hasData ? 'Click for details' : (loading ? 'Loading...' : 'Data unavailable')}
        </Box>
      </Paper>

      {/* Modal with blurred background */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        BackdropProps={{ sx: { backdropFilter: 'blur(3px)' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '16px' }}>
          Age-wise Breakdown Details
          <IconButton aria-label="close" onClick={() => setOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Future data and charts can be shown here.
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgeBreakdown;