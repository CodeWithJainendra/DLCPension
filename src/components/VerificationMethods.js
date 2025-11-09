import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { CircularProgress } from '@mui/material';
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

const VerificationMethods = ({ filters, refreshKey }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [chartData, setChartData] = useState({
    iris: 0,
    fingerprint: 0,
    face: 0,
    other: 0
  });
  const { isDarkMode, theme } = useTheme();

  const donut_data = {
    labels: ['Iris', 'Fingerprint', 'Face', 'Other'],
    datasets: [
      {
        data: [chartData.iris, chartData.fingerprint, chartData.face, chartData.other],
        backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#9c27b0'],
        borderWidth: 0,
        hoverOffset: 2,
        spacing: 3,
        borderRadius: 6,
      },
    ],
  };

  const _makeAPICallOrFetchFromCache = async (endpoint, params, ttlMs = 5 * 60 * 1000) => {
      const apiData = await fetchWithCache(endpoint, params, ttlMs);
      return apiData;
    };

  const fetchVerificationStats = async () => {
    setLoading(true);
    try {
      const response = await _makeAPICallOrFetchFromCache(
        'https://cdis.iitk.ac.in/dlc-backend/api/dashboard/authentication-methods', 
        { filters: filters }
      );
      const data = response["data"];

      setChartData({
        iris: data.iris || 0,
        fingerprint: data.fingerprint || 0,
        face: data.face || 0,
        other: data.other || 0
      });
      setLoading(false);

      // donut_data.datasets[0].data =  [chartData.iris, chartData.fingerprint, chartData.face, chartData.other];
    } catch (err) {
      console.error('Failed to fetch verification stats:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchVerificationStats();
  }, [filters, refreshKey]);


  const options = {
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    cutout: '68%',
    maintainAspectRatio: false,
  };

  return (
    <>
      <Paper
        elevation={0}
        onClick={() => setOpen(true)}
        sx={{
          padding: '10px',
          borderRadius: '8px',
          border: isDarkMode ? `1px solid ${theme.palette.custom.darkBlue}` : '1px solid #eaeaea',
          backgroundColor: isDarkMode ? theme.palette.background.paper : '#ffffff',
          marginBottom: 0,
          minHeight: '132px',
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            borderColor: isDarkMode ? theme.palette.primary.main : '#2196f3',
            boxShadow: isDarkMode ? `0 0 0 2px rgba(58,134,255,0.12)` : '0 0 0 2px rgba(33,150,243,0.12)'
          }
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '13px', fontFamily: 'Inter, Roboto, Arial, sans-serif', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', color: theme.palette.text.primary }}>
          DLC Verification Methods
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '100px' }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, minHeight: 0 }}>
            {/* Left list */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '180px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '10px', height: '10px', backgroundColor: '#4caf50', borderRadius: '50%', marginRight: '8px' }} />
                  <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>Iris</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>{chartData.iris}</Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '180px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '10px', height: '10px', backgroundColor: '#2196f3', borderRadius: '50%', marginRight: '8px' }} />
                  <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>Fingerprint</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>{chartData.fingerprint}</Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '180px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '10px', height: '10px', backgroundColor: '#ff9800', borderRadius: '50%', marginRight: '8px' }} />
                  <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>Face</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>{chartData.face}</Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '180px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '10px', height: '10px', backgroundColor: '#9c27b0', borderRadius: '50%', marginRight: '8px' }} />
                  <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>Other</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary }}>{chartData.other}</Typography>
              </Box>
            </Box>

            {/* Right segmented donut chart */}
            <Box sx={{ width: '72px', height: '72px', position: 'relative' }}>
              <Doughnut data={donut_data} options={options} plugins={[outerRingsPlugin]} />
              {/* <LockOutlinedIcon sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '16px', color: theme.palette.text.secondary }} /> */}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Modal */}
      {/* <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        BackdropProps={{ sx: { backdropFilter: 'blur(3px)' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '16px' }}>
          Verification Methods Details
          <IconButton aria-label="close" onClick={() => setOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Future data and charts can be shown here.
          </Typography>
        </DialogContent>
      </Dialog> */}
    </>
  );
}

export default VerificationMethods;