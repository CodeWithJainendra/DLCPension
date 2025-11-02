import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
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

const AgeBreakdown = (filters, refreshKey) => {
  const { isDarkMode, theme } = useTheme();
  const [open, setOpen] = useState(false);
  const total_count = useRef(0);
  const [ageStats, setAgeStats] = useState({
    '<60 Years': 0,
    '60-70 Years': 0,
    '70-80 Years': 0,
    '80-90 Years': 0,
    '90+ Years': 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false); // Guard against double-run in StrictMode
  const color_palette = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAgeDistribution();
  }, []);

  useEffect(() => {
    fetchAgeDistribution();
  }, [refreshKey]);

  

  useEffect(() => {
    // Calculate total count whenever ageStats change
    const total = Object.values(ageStats).reduce((sum, item) => sum + item, 0);
    total_count.current = total;
  }, [ageStats]);

  const fetchAgeDistribution = async () => {
    try {
      setLoading(true);
      setError(null);

      // API call with cache (5 minutes TTL)
      const apiData = await fetchWithCache(
        'http://localhost:9007/dlc-pension-data-api/api/dashboard/public-stats',
        {filters:filters, limit:null},
        5 * 60 * 1000 // 5 minutes cache
      );
      
      if (apiData.success && apiData.ageStats) {
        setAgeStats(apiData.ageStats);
      }
      setLoading(false);
      hasFetched.current = true;
    } catch (err) {
      console.error('❌ Failed to fetch age distribution:', err);
      setError(err.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data with fallback zeros when unavailable
  const data = {
    labels: Object.keys(ageStats),
    datasets: [
      {
        data: Object.values(ageStats),
        backgroundColor: color_palette,
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

  // Prepare modal chart and table data
  const totalCount = total_count.current;
  const modalChartData = {
    labels: Object.keys(ageStats),
    datasets: [
      {
        data: Object.values(ageStats),
        backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'],
        borderWidth: 0,
      },
    ],
  };

  const modalChartOptions = {
    plugins: { legend: { position: 'bottom' }, tooltip: { enabled: true } },
    cutout: '0%', // pie-style (no hole)
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
          minHeight: '150px',
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

        {loading && (
  <Box
    sx={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(2px)',
      backgroundColor: 'rgba(255,255,255,0.5)',
      zIndex: 10,
    }}
  >
    <CircularProgress size={24} />
  </Box>
)}
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Inter, Roboto, Arial, sans-serif', marginBottom: '19px', display: 'flex', alignItems: 'center', gap: '8px', color: theme.palette.text.primary }}>
          AGE-WISE BREAKDOWN
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, minHeight: 0 }}>
        
          {/* Left list */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '180px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '10px', height: '10px', backgroundColor: '#2196f3', borderRadius: '50%', marginRight: '8px' }} />
                        <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>Under 60</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>{Object.values(ageStats)[0]}</Typography>
                    </Box>
        
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '180px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '10px', height: '10px', backgroundColor: '#4caf50', borderRadius: '50%', marginRight: '8px' }} />
                        <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>60 - 70</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>{Object.values(ageStats)[1]}</Typography>
                    </Box>
        
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '180px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '10px', height: '10px', backgroundColor: '#f44336', borderRadius: '50%', marginRight: '8px' }} />
                        <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>70 - 80</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>{Object.values(ageStats)[2]}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '180px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '10px', height: '10px', backgroundColor: '#9c27b0', borderRadius: '50%', marginRight: '8px' }} />
                        <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>80-90</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>{Object.values(ageStats)[3]}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '180px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '10px', height: '10px', backgroundColor: '#ff9800', borderRadius: '50%', marginRight: '8px' }} />
                        <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>Above 90</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>{Object.values(ageStats)[4]}</Typography>
                    </Box>
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
          {!loading && !error && hasFetched ? 'Click for details' : (loading ? 'Loading...' : 'Data unavailable')}
        </Box>
      </Paper>

      {/* Modal with blurred background */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        BackdropProps={{ sx: { backdropFilter: 'blur(5px)' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '16px' }}>
          Age-wise Breakdown Details
          <IconButton aria-label="close" onClick={() => setOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Summary */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: '12px' }}>
              Total Pensioners
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '12px' }}>
              {totalCount.toLocaleString('en-IN')}
            </Typography>
          </Box>

          {/* Pie chart */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box sx={{ width: 280, height: 220 }}>
              <Doughnut data={modalChartData} options={modalChartOptions} />
            </Box>
          </Box>

          {/* Compact table */}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: '12px' }}>Age Group</TableCell>
                <TableCell align="right" sx={{ fontSize: '12px' }}>Count</TableCell>
                <TableCell align="right" sx={{ fontSize: '12px' }}>Percentage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(ageStats).forEach((item) => {
                const percentage = total_count.current > 0 ? (ageStats[item] / total_count.current) * 100 : 0;
                return (
                  <TableRow key={item.ageGroup}>
                    <TableCell sx={{ fontSize: '12px' }}>{item.ageGroup}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '12px' }}>
                      {total_count.current.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '12px' }}>
                      {percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgeBreakdown;