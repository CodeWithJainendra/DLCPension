import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BusinessIcon from '@mui/icons-material/Business';
import { useTheme } from '../contexts/ThemeContext';
import { fetchWithCache } from '../utils/cache';

// In the StateAnalytics component signature
const StateAnalytics = ({
  // Customizable column labels
  topStatesLeftLabel = 'State/UT',
  topStatesMiddleLabel = 'Total Pensioners',
  topStatesRightLabel = 'Completion Rate',
  // Add bank labels (customizable)
  topBanksLeftLabel = 'Bank',
  topBanksMiddleLabel = 'Total Pensioners',
  topBanksRightLabel = 'Completion Rate',
}) => {
  const [tabValue, setTabValue] = useState(0);
  const { isDarkMode, theme } = useTheme();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const [topStates, setTopStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchTopStates();
  }, []);

  const fetchTopStates = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiData = await fetchWithCache(
        'https://samar.iitk.ac.in/dlc-pension-data-api/api/dashboard/public-top-states',
        {},
        5 * 60 * 1000 // 5 minutes cache
      );

      // Try common response shapes and normalize
      // Inside fetchTopStates() normalization
      const list = Array.isArray(apiData?.topStates)
        ? apiData.topStates
        : Array.isArray(apiData?.data)
        ? apiData.data
        : Array.isArray(apiData)
        ? apiData
        : [];
      
      const getName = (item) =>
        item.state || item.stateName || item.name || item.STATE || 'Unknown';
      
      const getTotalPensioners = (item) =>
        item.total_pensioners ?? item.pensioners ?? item.total ?? item.count ?? 0;
      
      const getCompleted = (item) =>
        item.completed ?? item.dlc ?? item.completedDLC ?? item.verified ?? 0;
      
      const getCompletionRate = (item) => {
        const rateRaw = item.completionRate ?? item.rate ?? item.percentage;
        if (rateRaw != null) return Number(rateRaw);
        const total = getTotalPensioners(item);
        const completed = getCompleted(item);
        return total > 0 ? (completed / total) * 100 : 0;
      };
      
      const normalized = list
        .map((item) => ({
          name: getName(item),
          totalPensioners: getTotalPensioners(item),
          completionRate: getCompletionRate(item),
        }))
        // Sort by completion rate descending (adjust if you prefer a different sort)
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, 5);
      
      setTopStates(normalized);
    } catch (err) {
      console.error('Failed to fetch top states:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [topBanks, setTopBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState(null);
  const banksFetched = useRef(false);

  useEffect(() => {
    // Fetch banks the first time the tab is opened
    if (tabValue === 1 && !banksFetched.current) {
      banksFetched.current = true;
      fetchTopBanks();
    }
  }, [tabValue]);

  // Inside fetchTopBanks()
  const fetchTopBanks = async () => {
    try {
      setBanksLoading(true);
      setBanksError(null);

      const apiData = await fetchWithCache(
        'https://samar.iitk.ac.in/dlc-pension-data-api/api/top-banks',
        {},
        5 * 60 * 1000
      );

      // Normalize response
      const list = Array.isArray(apiData?.topBanks)
        ? apiData.topBanks
        : Array.isArray(apiData?.data)
        ? apiData.data
        : Array.isArray(apiData)
        ? apiData
        : [];

      const getName = (item) =>
        item.bank || item.Bank_name || item.name || item.BANK || 'Unknown';

      // Strict total-pensioners mapping; avoid verified/DLC counts
      const getTotalPensioners = (item) =>
        item.all_pensioner_count ??
        item.total_pensioners ??
        item.pensioners ??
        item.totalPensionersCount ??
        0;

      const getCompleted = (item) =>
        item.verified_pensioner_count ?? item.dlc ?? item.completedDLC ?? item.verified ?? 0;

      const getCompletionRate = (item) => {
        const rateRaw = item.completionRate ?? item.rate ?? item.percentage;
        if (rateRaw != null) return Number(rateRaw);
        const total = getTotalPensioners(item);
        const completed = getCompleted(item);
        return total > 0 ? (completed / total) * 100 : 0;
      };

  const normalized = list
        .map((item) => ({
           name: getName(item),
          totalPensioners: getTotalPensioners(item),
          completionRate: getCompletionRate(item),
        }));
  
      // Remove duplicates by name, keep best performer
      const unique = dedupeByNameKeepBest(normalized);
  
      // Sort and take top 5
      const top5 = unique.sort((a, b) => b.completionRate - a.completionRate).slice(0, 5);
  
      setTopBanks(top5);
    } catch (err) {
      console.error('❌ Failed to fetch top banks:', err);
      setBanksError(err.message);
    } finally {
      setBanksLoading(false);
    }
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
        {/* Top States tab remains as-is */}
        {tabValue === 0 && (
          <Box>
            {/* Header row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '3px 0',
                borderBottom: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '12px',
                  fontFamily: 'Inter, Roboto, Arial, sans-serif',
                  flex: '0 0 50%',
                  textAlign: 'left',
                }}
              >
                {topStatesLeftLabel}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '12px',
                  fontFamily: 'Inter, Roboto, Arial, sans-serif',
                  flex: '0 0 25%',
                  textAlign: 'center',
                }}
              >
                {topStatesMiddleLabel}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '12px',
                  fontFamily: 'Inter, Roboto, Arial, sans-serif',
                  flex: '0 0 25%',
                  textAlign: 'center',
                }}
              >
                {topStatesRightLabel}
              </Typography>
            </Box>

            {loading && (
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
                Loading…
              </Typography>
            )}
            {error && (
              <Typography variant="body2" sx={{ color: theme.palette.error.main, fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
                {error}
              </Typography>
            )}
            {!loading && !error && (
              <>
                {topStates.length > 0 ? (
                  topStates.map((item, idx) => (
                    <Box
                      key={item.name + idx}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '3px 0',
                        borderBottom:
                          idx < topStates.length - 1
                            ? isDarkMode
                              ? '1px solid #415A77'
                              : '1px solid #eaeaea'
                            : 'none',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: '12px',
                          fontFamily: 'Inter, Roboto, Arial, sans-serif',
                          flex: '0 0 50%',
                          // keep state names left-aligned for readability
                          textAlign: 'left',
                        }}
                      >
                        {idx + 1}. {item.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: '12px',
                          fontFamily: 'Inter, Roboto, Arial, sans-serif',
                          flex: '0 0 25%',
                          textAlign: 'center',
                        }}
                      >
                        {item.totalPensioners}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: '12px',
                          fontFamily: 'Inter, Roboto, Arial, sans-serif',
                          flex: '0 0 25%',
                          textAlign: 'center',
                        }}
                      >
                        {item.completionRate.toFixed(1)}%
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
                    No data found.
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}
        
        {/* Top Banks tab - now rendered like Top States */}
        {tabValue === 1 && (
          <Box>
            {/* Header row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '3px 0',
                borderBottom: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '12px',
                  fontFamily: 'Inter, Roboto, Arial, sans-serif',
                  flex: '0 0 50%',
                  textAlign: 'left',
                }}
              >
                {topBanksLeftLabel}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '12px',
                  fontFamily: 'Inter, Roboto, Arial, sans-serif',
                  flex: '0 0 25%',
                  textAlign: 'center',
                }}
              >
                {topBanksMiddleLabel}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '12px',
                  fontFamily: 'Inter, Roboto, Arial, sans-serif',
                  flex: '0 0 25%',
                  textAlign: 'center',
                }}
              >
                {topBanksRightLabel}
              </Typography>
            </Box>

            {banksLoading && (
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
                Loading…
              </Typography>
            )}
            {banksError && (
              <Typography variant="body2" sx={{ color: theme.palette.error.main, fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
                {banksError}
              </Typography>
            )}
            {!banksLoading && !banksError && (
              <>
                {topBanks.length > 0 ? (
                  topBanks.map((item, idx) => (
                    <Box
                      key={item.name + idx}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '3px 0',
                        borderBottom:
                          idx < topBanks.length - 1
                            ? isDarkMode
                              ? '1px solid #415A77'
                              : '1px solid #eaeaea'
                            : 'none',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: '12px',
                          fontFamily: 'Inter, Roboto, Arial, sans-serif',
                          flex: '0 0 50%',
                          textAlign: 'left',
                        }}
                      >
                        {idx + 1}. {item.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: '12px',
                          fontFamily: 'Inter, Roboto, Arial, sans-serif',
                          flex: '0 0 25%',
                          textAlign: 'center',
                        }}
                      >
                        {item.totalPensioners}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: '12px',
                          fontFamily: 'Inter, Roboto, Arial, sans-serif',
                          flex: '0 0 25%',
                          textAlign: 'center',
                        }}
                      >
                        {item.completionRate.toFixed(1)}%
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '12px', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
                    No data found.
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}
        
        {/* Top PSAs tab unchanged */}
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

// Helpers to avoid duplicates across API items
const canon = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const dedupeByNameKeepBest = (arr) => {
  const best = new Map();
  arr.forEach((item) => {
    const key = canon(item.name);
    const current = best.get(key);
    if (!current) {
      best.set(key, item);
      return;
    }
    // Prefer higher completion rate; tie-break by total pensioners
    const cmp =
      (item.completionRate || 0) - (current.completionRate || 0) ||
      (item.totalPensioners || 0) - (current.totalPensioners || 0);
    if (cmp > 0) best.set(key, item);
  });
  return Array.from(best.values());
};