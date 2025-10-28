import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Tabs, Tab, CircularProgress } from '@mui/material';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import { useTheme } from '../contexts/ThemeContext';
import { fetchWithCache } from '../utils/cache';

// In the StateAnalytics component signature
const StateAnalytics = ({
  // Customizable column labels
  leftLabel = {
    "state": "State / UT",
    "PSA": "PSA",
    "bank": "Bank",
    "central_subtype": "Central types"
  },
  middleLabel = 'Total Pensioners',
  rightLabel = 'Completion Rate',
}) => {
  const [tabValue, setTabValue] = useState(0);
  const { isDarkMode, theme } = useTheme();

  // Responsive styling utilities
  const getResponsiveHeaderStyle = () => ({
    fontWeight: 600,
    color: theme.palette.text.primary,
    fontSize: { xs: '10px', sm: '11px', md: '12px' },
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  });

  const getResponsiveDataStyle = () => ({
    color: theme.palette.text.secondary,
    fontSize: { xs: '10px', sm: '11px', md: '12px' },
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  });

  const getResponsiveMessageStyle = () => ({
    color: theme.palette.text.secondary,
    fontSize: { xs: '10px', sm: '11px', md: '12px' },
    fontFamily: 'Inter, Roboto, Arial, sans-serif'
  });

  const getResponsiveErrorStyle = () => ({
    color: theme.palette.error.main,
    fontSize: { xs: '10px', sm: '11px', md: '12px' },
    fontFamily: 'Inter, Roboto, Arial, sans-serif'
  });

  // Reusable centered loading overlay for the card content
  const LoadingOverlay = ({ show }) =>
    show ? (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(1px)',
          zIndex: 1
        }}
      >
        <CircularProgress sx={{ color: theme.palette.primary.main }} size={28} />
      </Box>
    ) : null;

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
  
  const [topPSAs, setTopPSAs] = useState([]);
  const [psaLoading, setPSALoading] = useState(false);
  const [psaError, setPSAError] = useState(null);
  const psaFetched = useRef(false);

  const [topCategories, setTopCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const categoriesFetched = useRef(false);
  
  const [topPensionerTypes, setTopPensionerTypes] = useState([]);
  const [ptypesLoading, setPTypesLoading] = useState(false);
  const [ptypesError, setPTypesError] = useState(null);
  const ptypesFetched = useRef(false);

  // Dedupe helper (shared for states/banks/PSAs)
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
      const cmp =
        (item.completionRate || 0) - (current.completionRate || 0) ||
        (item.totalPensioners || 0) - (current.totalPensioners || 0);
      if (cmp > 0) best.set(key, item);
    });
    return Array.from(best.values());
  };

  // Reusable fetch+normalize for top performers
  const fetchTopData = async (endpoint, { nameKey, totalKey, completionKey }, ttlMs = 5 * 60 * 1000) => {
    const apiData = await fetchWithCache(endpoint, {}, ttlMs);

    // Accept array payloads or object payloads keyed by indices; ignore non-entry metadata
    const payload = apiData?.data ?? apiData;
    let list = [];

    if (Array.isArray(payload)) {
      list = payload;
    } 
    // else if (payload && typeof payload === 'object') {
    //   list = Object.values(payload).filter(
    //     (v) =>
    //       v &&
    //       typeof v === 'object' &&
    //       ((Array.isArray(nameKey) ? nameKey.some(k => k in v) : nameKey in v) ||
    //        (Array.isArray(totalKey) ? totalKey.some(k => k in v) : totalKey in v) ||
    //        (Array.isArray(completionKey) ? completionKey.some(k => k in v) : completionKey in v))
    //   );
    // } 
    else {
      list = [];
    }

    const resolveValue = (obj, keyOrKeys) => {
      if (Array.isArray(keyOrKeys)) {
        for (const k of keyOrKeys) {
          if (obj[k] != null) return obj[k];
        }
        return undefined;
      }
      return obj[keyOrKeys];
    };

    const normalized = list.map((item) => {
      const rawName = resolveValue(item, nameKey);
      const name =
        rawName == null || String(rawName).trim() === '' ? 'Unknown' : String(rawName);

      const totalRaw = resolveValue(item, totalKey);
      const totalPensioners = Number(totalRaw ?? 0);

      const rawRatio = resolveValue(item, completionKey);
      const completedFallback =
        item.verified_pensioner_count ??
        item.verified ??
        item.completedDLC ??
        item.completed ??
        null;

      let completionRate;
      if (rawRatio != null && !Number.isNaN(Number(rawRatio))) {
        completionRate = Number(rawRatio) <= 1 ? Number(rawRatio) * 100 : Number(rawRatio);
      } else if (completedFallback != null && totalPensioners > 0) {
        completionRate = (Number(completedFallback) / totalPensioners) * 100;
      } else {
        completionRate = 0;
      }

      return { name, totalPensioners, completionRate };
    });
    
    // Filter out items with unknown names or zero pensioners
    const filtered = normalized.filter(item => 
      item.name !== 'Unknown' && item.totalPensioners > 0
    );

    const unique = dedupeByNameKeepBest(filtered.length > 0 ? filtered : normalized);
    return unique.sort((a, b) => b.completionRate - a.completionRate).slice(0, 5);
  };

  useEffect(() => {
    // Fetch banks the first time the tab is opened
    if (tabValue === 1 && !banksFetched.current) {
      banksFetched.current = true;
      fetchTopBanks();
    }
    // Fetch PSAs on first open of the tab
    if (tabValue === 2 && !psaFetched.current) {
      psaFetched.current = true;
      fetchTopPSAs();
    }
    // Fetch Categories on first open of the tab
    if (tabValue === 3 && !categoriesFetched.current) {
      categoriesFetched.current = true;
      fetchTopCentralPensionSubtypes();
    }
    // Fetch Pensioner Types on first open of the tab
    if (tabValue === 4 && !ptypesFetched.current) {
      ptypesFetched.current = true;
      fetchTopPensionerTypes();
    }
  }, [tabValue]);

  // Inside fetchTopBanks()
  // Refactor Top Banks to reuse fetchTopData
  const fetchTopBanks = async () => {
    try {
      setBanksLoading(true);
      setBanksError(null);
      const items = await fetchTopData(
        'https://samar.iitk.ac.in/dlc-pension-data-api/api/top-banks',
        { 
          nameKey: ['Bank_name', 'bank_name', 'bank', 'Bank'], 
          totalKey: ['all_pensioner_count', 'total_pensioners', 'count', 'total'], 
          completionKey: ['completion_ratio', 'completion_rate', 'rate'] 
        }
      );
      setTopBanks(items);
    } catch (err) {
      console.error('❌ Failed to fetch top banks:', err);
      setBanksError(err.message);
    } finally {
      setBanksLoading(false);
    }
  };
  
  const fetchTopPSAs = async () => {
    try {
      setPSALoading(true);
      setPSAError(null);
      const items = await fetchTopData(
        'https://samar.iitk.ac.in/dlc-pension-data-api/api/top-psa',
        { 
          nameKey: ['psa', 'PSA', 'psa_name', 'PSA_name'], 
          totalKey: ['total_pensioners', 'all_pensioner_count', 'count', 'total'], 
          completionKey: ['completion_ratio', 'completion_rate', 'rate'] 
        }
      );
      setTopPSAs(items);
    } catch (err) {
      console.error('❌ Failed to fetch top PSAs:', err);
      setPSAError(err.message);
    } finally {
      setPSALoading(false);
    }
  };

  const fetchTopCentralPensionSubtypes = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);

      // Try multiple candidates to avoid 404s due to path variants
      const candidates = [                                             // dev proxy
        'https://samar.iitk.ac.in/dlc-pension-data-api/api/psa-pensioner-types', // fallback (different shape)
      ];

      const tryEndpoints = async () => {
        let lastErr = null;
        for (const endpoint of candidates) {
          try {
            const items = await fetchTopData(
              endpoint,
              { 
                nameKey: ['Pensioner_subtype'], 
                totalKey: ['all_pensioner_count'], 
                completionKey: ['completion_ratio'] 
              }
            );
            if (items && items.length >= 0) return items;
          } catch (err) {
            lastErr = err;
            // Continue trying next candidate
          }
        }
        throw lastErr || new Error('No valid endpoint for top categories');
      };

      const items = await tryEndpoints();
      const cleaned = items.filter((i) => i.name !== 'Unknown' && i.totalPensioners > 0);
      setTopCategories(cleaned);
    } catch (err) {
      console.error('❌ Failed to fetch top categories:', err);
      setCategoriesError(
        err?.message?.includes('404')
          ? 'Endpoint not found (404). Please verify the Top Categories API path.'
          : err.message
      );
    } finally {
      setCategoriesLoading(false);
    }
  };
  
  const fetchTopPensionerTypes = async () => {
    try {
      setPTypesLoading(true);
      setPTypesError(null);
      const items = await fetchTopData(
        'https://samar.iitk.ac.in/dlc-pension-data-api/api/psa-pensioner-types',
        { 
          nameKey: ['Pensioner_type', 'pensioner_type', 'type', 'Type'], 
          totalKey: ['all_pensioner_count', 'total_pensioners', 'count', 'total'], 
          completionKey: ['completion_ratio', 'completion_rate', 'rate'] 
        }
      );
      setTopPensionerTypes(items);
    } catch (err) {
      console.error('❌ Failed to fetch pensioner types:', err);
      setPTypesError(err.message);
    } finally {
      setPTypesLoading(false);
    }
  };
  
  // JSX: Top PSAs tab rendering (3 columns, consistent with States/Banks)
  return (
    <Paper elevation={0} sx={{ 
      padding: { xs: '6px', sm: '8px', md: '5px' }, 
      borderRadius: '8px',
      border: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea',
      marginBottom: '15px',
      height: 'auto',
      minHeight: { xs: '280px', sm: '320px', md: '280px' },
      maxHeight: { xs: '400px', sm: '450px', md: '200px' },
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: theme.palette.background.paper
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '5px'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '11px', sm: '12px', md: '13px' }, fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              {/* States tab */}
              <Tab 
                icon={<LocationCityIcon fontSize="small" />} 
                iconPosition="start"
                label="Top States" 
                disableRipple
                sx={{ 
                  textTransform: 'none', 
                  fontSize: { xs: '9px', sm: '10px', md: '11px' },
                  minHeight: { xs: '24px', sm: '26px', md: '28px' },
                  padding: { xs: '0 4px', sm: '0 6px', md: '0 8px' },
                  fontFamily: 'Inter, Roboto, Arial, sans-serif',
                  backgroundColor: isDarkMode ? theme.palette.background.default : '#f3f5f7',
                  color: theme.palette.text.secondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  '&.Mui-selected': { backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff', color: theme.palette.primary.main },
                  '&:not(:last-of-type)': { borderRight: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea' }
                }} 
              />
              {/* Top Banks */}
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
              {/* Top PSA  */}
              <Tab 
                icon={<CategoryIcon fontSize="small" />} 
                iconPosition="start"
                label="Top PSA" 
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
              {/* Top Central pensioner Types */}``
              <Tab 
                icon={<BusinessIcon fontSize="small" />} 
                iconPosition="start"
                label="Central" 
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
      
      <Box sx={{ 
        padding: { xs: '2px 0', sm: '3px 0', md: '4px 0' }, 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'auto',
        minHeight: 0,
        position: 'relative' // enable overlay positioning
      }}>
        {/* Spinner overlay for the active tab */}
        {(() => {
          const isTabLoading =
            tabValue === 0 ? loading :
            tabValue === 1 ? banksLoading :
            tabValue === 2 ? psaLoading :
            tabValue === 3 ? categoriesLoading :
            tabValue === 4 ? ptypesLoading : false;
          return <LoadingOverlay show={isTabLoading} />;
        })()}
        {/* Top States tab */}
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
                  fontSize: { xs: '10px', sm: '11px', md: '12px' },
                  fontFamily: 'Inter, Roboto, Arial, sans-serif',
                  flex: { xs: '1 1 45%', sm: '0 0 50%' },
                  textAlign: 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  pr: 1,
                }}
              >
                {leftLabel["state"]}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '10px', sm: '11px', md: '12px' },
                  fontFamily: 'Inter, Roboto, Arial, sans-serif',
                  flex: { xs: '1 1 27%', sm: '0 0 25%' },
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {middleLabel}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '10px', sm: '11px', md: '12px' },
                  fontFamily: 'Inter, Roboto, Arial, sans-serif',
                  flex: { xs: '1 1 27%', sm: '0 0 25%' },
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {rightLabel}
              </Typography>
            </Box>

            {/* Loading indicator replaced by overlay */}
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
                        {item.completionRate >= 0 ? `${item.completionRate.toFixed(1)}%` : '-'}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={getResponsiveMessageStyle()}>
                    No data found.
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}
        
        {/* Top Banks tab*/}
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
                  ...getResponsiveHeaderStyle(),
                  flex: { xs: '1 1 45%', sm: '0 0 50%' },
                  textAlign: 'left',
                  pr: 1,
                }}
              >
                {leftLabel["bank"]}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  ...getResponsiveHeaderStyle(),
                  flex: { xs: '1 1 27%', sm: '0 0 25%' },
                  textAlign: 'center',
                }}
              >
                {middleLabel}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  ...getResponsiveHeaderStyle(),
                  flex: { xs: '1 1 27%', sm: '0 0 25%' },
                  textAlign: 'center',
                }}
              >
                {rightLabel}
              </Typography>
            </Box>

            {/* Loading indicator replaced by overlay */}
            {banksError && (
              <Typography variant="body2" sx={getResponsiveErrorStyle()}>
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
                          fontSize: { xs: '10px', sm: '11px', md: '12px' },
                          fontFamily: 'Inter, Roboto, Arial, sans-serif',
                          flex: { xs: '1 1 45%', sm: '0 0 50%' },
                          textAlign: 'left',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          pr: 1,
                        }}
                      >
                        {idx + 1}. {item.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: { xs: '10px', sm: '11px', md: '12px' },
                          fontFamily: 'Inter, Roboto, Arial, sans-serif',
                          flex: { xs: '1 1 27%', sm: '0 0 25%' },
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.totalPensioners}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: { xs: '10px', sm: '11px', md: '12px' },
                          fontFamily: 'Inter, Roboto, Arial, sans-serif',
                          flex: { xs: '1 1 27%', sm: '0 0 25%' },
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.completionRate >= 0 ? `${item.completionRate.toFixed(1)}%` : '-'}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={getResponsiveMessageStyle()}>
                    No data found.
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}
        
        {/* Top PSAs tab */}
        {tabValue === 2 && (
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
                  ...getResponsiveHeaderStyle(),
                  flex: { xs: '1 1 45%', sm: '0 0 50%' },
                  textAlign: 'left',
                  pr: 1,
                }}
              >
                {leftLabel["PSA"]}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  ...getResponsiveHeaderStyle(),
                  flex: { xs: '1 1 27%', sm: '0 0 25%' },
                  textAlign: 'center',
                }}
              >
                {middleLabel}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  ...getResponsiveHeaderStyle(),
                  flex: { xs: '1 1 27%', sm: '0 0 25%' },
                  textAlign: 'center',
                }}
              >
                {rightLabel}
              </Typography>
            </Box>

            {/* Loading indicator replaced by overlay */}
            {psaError && (
              <Typography variant="body2" sx={getResponsiveErrorStyle()}>
                {psaError}
              </Typography>
            )}
            {!psaLoading && !psaError && (
              <>
                {topPSAs.length > 0 ? (
                  topPSAs.map((item, idx) => (
                    <Box
                      key={item.name + idx}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '3px 0',
                        borderBottom:
                          idx < topPSAs.length - 1
                            ? isDarkMode
                              ? '1px solid #415A77'
                              : '1px solid #eaeaea'
                            : 'none',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          ...getResponsiveDataStyle(),
                          flex: { xs: '1 1 45%', sm: '0 0 50%' },
                          textAlign: 'left',
                          pr: 1,
                        }}
                      >
                        {idx + 1}. {item.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          ...getResponsiveDataStyle(),
                          flex: { xs: '1 1 27%', sm: '0 0 25%' },
                          textAlign: 'center',
                        }}
                      >
                        {item.totalPensioners}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          ...getResponsiveDataStyle(),
                          flex: { xs: '1 1 27%', sm: '0 0 25%' },
                          textAlign: 'center',
                        }}
                      >
                        {item.completionRate >= 0 ? `${item.completionRate.toFixed(1)}%` : '-'}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={getResponsiveMessageStyle()}>
                    No data found.
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}

        {/* Top Categories tab */}
        {tabValue === 3 && (
          <Box>
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
                  ...getResponsiveHeaderStyle(),
                  flex: { xs: '1 1 45%', sm: '0 0 50%' },
                  textAlign: 'left',
                  pr: 1,
                }}
              >
                {leftLabel["central_subtype"]}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  ...getResponsiveHeaderStyle(),
                  flex: { xs: '1 1 27%', sm: '0 0 25%' },
                  textAlign: 'center',
                }}
              >
                {middleLabel}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  ...getResponsiveHeaderStyle(),
                  flex: { xs: '1 1 27%', sm: '0 0 25%' },
                  textAlign: 'center',
                }}
              >
                {rightLabel}
              </Typography>
            </Box>

            {/* Loading indicator replaced by overlay */}
            {categoriesError && (
              <Typography variant="body2" sx={getResponsiveErrorStyle()}>
                {categoriesError}
              </Typography>
            )}
            {!categoriesLoading && !categoriesError && (
              <>
                {topCategories.length > 0 ? (
                  topCategories.map((item, idx) => (
                    <Box
                      key={item.name + idx}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '3px 0',
                        borderBottom:
                          idx < topCategories.length - 1
                            ? isDarkMode
                              ? '1px solid #415A77'
                              : '1px solid #eaeaea'
                            : 'none',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          ...getResponsiveDataStyle(),
                          flex: { xs: '1 1 45%', sm: '0 0 50%' },
                          textAlign: 'left',
                          pr: 1,
                        }}
                      >
                        {idx + 1}. {item.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          ...getResponsiveDataStyle(),
                          flex: { xs: '1 1 27%', sm: '0 0 25%' },
                          textAlign: 'center',
                        }}
                      >
                        {item.totalPensioners}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          ...getResponsiveDataStyle(),
                          flex: { xs: '1 1 27%', sm: '0 0 25%' },
                          textAlign: 'center',
                        }}
                      >
                        {item.completionRate >= 0 ? `${item.completionRate.toFixed(1)}%` : '-'}
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
      </Box>
      

    </Paper>
  );
};

export default StateAnalytics;