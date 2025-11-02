import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Tabs, Tab, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton, FormControl, Select, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import { useTheme } from '../contexts/ThemeContext';
import { fetchWithCache } from '../utils/cache';

// In the StateAnalytics component signature
const StateAnalytics = ({ filters, refreshKey }) => {

  const tabIndexToInfoMap = { 0: "state", 1: "bank", 2: "PSA", 3: "central_subtype" }
  const tabInfo = {
    'state': { api: "http://localhost:9007/dlc-pension-data-api/api/top-states", leftLabel: "State / UT", nameKey: ['state'], totalKey: ['all_pensioner_count'], completionKey: ['completion_ratio'], title: "States" },
    'PSA': { api: "http://localhost:9007/dlc-pension-data-api/api/top-psas", leftLabel: "PSA", nameKey: ['psa'], totalKey: ['all_pensioner_count'], completionKey: ['completion_ratio'], title: "PSAs" },
    'bank': { api: "http://localhost:9007/dlc-pension-data-api/api/top-banks", leftLabel: "Bank", nameKey: ['Bank_name'], totalKey: ['all_pensioner_count'], completionKey: ['completion_ratio'], title: "Banks" },
    'central_subtype': { api: "http://localhost:9007/dlc-pension-data-api/api/top-central-pensioner-subtypes", leftLabel: "Central types", nameKey: ['Pensioner_subtype'], totalKey: ['all_pensioner_count'], completionKey: ['completion_ratio'], title: "Central" },
  }
  const middleLabel = 'Total Pensioners'
  const rightLabel = 'Completion Rate'

  const [tabValue, setTabValue] = useState(0);
  const { isDarkMode, theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedState, setSelectedState] = useState('ALL');

  // State and hooks for the analytics tabs on the right.
  const [topItems, setTopItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);
  const itemsFetched = useRef(false);
  const currentTabInfo = useRef(tabInfo["state"]);

  // State and hooks for the show more popup from analytics tab.
  const [allItems, setAllItems] = useState([]);
  const [allItemsError, setAllItemsError] = useState(null);
  const allItemsFetched = useRef(false);
  const [allItemsLoading, setAllItemsLoading] = useState(true);

  const [popupLoading, setPopupLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);
  const [expandedItems, setexpandedItems] = useState(null);


  // Responsive styling utilities
  const getResponsiveHeaderStyle = () => ({
    fontWeight: 600,
    color: theme.palette.text.primary,
    fontSize: { xs: '10px', sm: '11px', md: '12px' },
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    // allow wrapping for long labels
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  });

  const getResponsiveDataStyle = () => ({
    color: theme.palette.text.secondary,
    fontSize: { xs: '10px', sm: '11px', md: '12px' },
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    // allow wrapping for long values
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
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
    setItemsLoading(true);
    itemsFetched.current = false;
    currentTabInfo.current = tabInfo[tabIndexToInfoMap[newValue]];
    setTabValue(newValue);
  };

  useEffect(() => {
    if (tabValue !== 0 && itemsFetched.current) return;
    fetchTopItemsForList(tabIndexToInfoMap[tabValue]);
    itemsFetched.current = true;
  }, []);

  useEffect(() => {
    // Refetch data when filters or refreshKey change
    fetchTopItemsForList(tabIndexToInfoMap[tabValue]);
    itemsFetched.current = true;
  }, [filters, refreshKey]);

  const _makeAPICallOrFetchFromCache = async (endpoint, params, ttlMs = 5 * 60 * 1000) => {
    console.log("Inside _makeAPICallOrFetchFromCache", params);
    const apiData = await fetchWithCache(endpoint, params, ttlMs);

    // Accept array payloads OR object payloads where data sits in a known key
    const topItemsList = apiData["data"];
    return topItemsList;
  };

  useEffect(() => {
    if (!itemsFetched.current) {
      currentTabInfo.current = tabInfo[tabIndexToInfoMap[tabValue]];
      itemsFetched.current = true;
      fetchTopItemsForList(tabIndexToInfoMap[tabValue]);
    }
  }, [tabValue]);

  const handleShowMore = async () => {
    setIsModalOpen(true);
    currentTabInfo.current = tabInfo[tabIndexToInfoMap[tabValue]];
    try {
      setAllItemsLoading(true);
      allItemsFetched.current = false;
      setAllItemsError(null);
      console.log("Calling _makeAPICallOrFetchFromCache", filters);
      const items = await _makeAPICallOrFetchFromCache(currentTabInfo.current.api, 
        { 
          filters:filters, 
          limit: 35 
        }, 
        60 * 1000);
      setAllItems(items);
      allItemsFetched.current = false;
      setAllItemsLoading(false);
    } catch (err) {
      setError(err.message);
    } finally {
      allItemsFetched.current = true;
      setAllItemsLoading(false);
    }
  };

  const fetchTopItemsForList = async (list_name) => {
    try {
      setItemsLoading(true);
      itemsFetched.current = false;
      setItemsError(null);
      const this_tabInfo = tabInfo[list_name]
      console.log("Calling _makeAPICallOrFetchFromCache", filters);

      const items = await _makeAPICallOrFetchFromCache(this_tabInfo.api, { 
        filters:filters, 
        limit: 5 
      });
      setTopItems(items);
      itemsFetched.current = true;
    } catch (err) {
      console.error('❌ Failed to fetch top items:', list_name, err);
      setItemsError(err.message);
    } finally {
      setItemsLoading(false);
    }
  };

  return (
    <>
      <Paper elevation={0} sx={{
        padding: { xs: '6px', sm: '8px', md: '5px' },
        borderRadius: '8px',
        border: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea',
        marginBottom: '100px',
        height: '220px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        backgroundColor: theme.palette.background.paper
      }}>
        {/* This section renders the Card's header that reads "Analytics", along with the show more button. */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '5px'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '11px', sm: '12px', md: '13px' }, fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {"TOP PERFORMERS"}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: '12px',
              fontFamily: 'Inter, Roboto, Arial, sans-serif',
              color: theme.palette.primary.main,
              cursor: 'pointer'
            }}
            onClick={handleShowMore}
          >
            Show more
          </Typography>
        </Box>

        {/* This section renders the four tab nav and handles the switching  */}
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

        {/* This section renders the Card's main content- the top 5 list with loading and error handling. */}
        <Box sx={{
          padding: { xs: '2px 0', sm: '3px 0', md: '4px 0' },
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          position: 'relative' // enable overlay positioning
        }}>
          {(() => {
            return <LoadingOverlay show={itemsLoading} />;
          })()}
          {(
            <Box>
              {/* Header row */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    ...getResponsiveHeaderStyle(),
                    fontSize: { xs: '10px' },
                    flex: '0 0 50%',
                    textAlign: 'left'
                  }}
                >
                  {currentTabInfo.current.leftLabel}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    ...getResponsiveHeaderStyle(),
                    fontSize: { xs: '10px' },
                    flex: '0 0 25%',
                    textAlign: 'center'
                  }}
                >
                  {middleLabel}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    ...getResponsiveHeaderStyle(),
                    fontSize: { xs: '10px' },
                    flex: '0 0 25%',
                    textAlign: 'center'
                  }}
                >
                  {rightLabel}
                </Typography>
              </Box>

              {/* Loading indicator replaced by overlay */}
              {error && (
                <Typography variant="body2" sx={getResponsiveErrorStyle()}>
                  {"Error:" + error}
                </Typography>
              )}

              {itemsFetched && !error && (
                <>
                  {topItems.length > 0 ? (topItems.map((item, idx) => (

                    <Box
                      key={item.name + idx}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        borderBottom:
                          idx < topItems.length - 1
                            ? isDarkMode
                              ? '1px solid #415A77'
                              : '1px solid #eaeaea'
                            : 'none',
                      }}
                    >
                      <Typography
                        key={item.name + idx + "left"}
                        variant="body2"
                        sx={{
                          ...getResponsiveDataStyle(),
                          fontSize: { xs: '10px' },
                          flex: '0 0 50%',
                          textAlign: 'left',
                        }}
                      >
                        {idx + 1}. {item[currentTabInfo.current.nameKey]}
                      </Typography>
                      <Typography
                        variant="body2"
                        key={item.name + idx + "all-pensioners"}
                        sx={{
                          ...getResponsiveDataStyle(),
                          fontSize: { xs: '10px' },
                          flex: '0 0 25%',
                          textAlign: 'center',
                        }}
                      >
                        {item[currentTabInfo.current.totalKey[0]]}
                      </Typography>
                      <Typography
                        variant="body2"
                        key={item.name + idx + "completion-ratio"}
                        sx={{
                          ...getResponsiveDataStyle(),
                          fontSize: { xs: '10px' },
                          flex: '0 0 25%',
                          textAlign: 'center',
                        }}
                      >
                        {item[currentTabInfo.current.completionKey[0]] >= 0 ? `${item[currentTabInfo.current.completionKey[0]].toFixed(1)}%` : '-'}
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
        </Box>


      </Paper>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fullWidth
        maxWidth="sm"
        minHeight="md"
        PaperProps={{
          sx: {
            borderRadius: '10px',
            backgroundColor: theme.palette.background.paper,
            border: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea'
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'
          }
        }}
      >
        <DialogTitle
          component="div"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1, gap: '8px' }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 'bold', fontSize: '13px', color: theme.palette.text.primary }}
          >
            Top {currentTabInfo.current.title}
          </Typography>


          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  displayEmpty
                  renderValue={(val) => (val === 'ALL' ? 'All States' : val)}
                  sx={{ fontSize: '12px' }}
                >
                  <MenuItem value="ALL" sx={{ fontSize: '12px' }}>All States</MenuItem>
                  {Array.from(new Set((expandedItems ?? topItems).map((s) => s.name))).map((name) => (
                    <MenuItem key={name} value={name} sx={{ fontSize: '12px' }}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl> */}
            <IconButton aria-label="close" onClick={() => setIsModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 1, minHeight: '300px' }}>
          <Box sx={{ position: 'relative', maxHeight: '50vh', overflow: 'auto' }}>
            {(() => {
              return (
                <LoadingOverlay show={allItemsLoading} />
              );
            })()}
            {(
              <Box sx={{ minHeight: '200px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea' }}>
                  <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 50%', textAlign: 'left' }}>{currentTabInfo.current.title}</Typography>
                  <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 25%', textAlign: 'center' }}>{middleLabel}</Typography>
                  <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 25%', textAlign: 'center' }}>{rightLabel}</Typography>
                </Box>
                {error && (<Typography variant="body2" sx={getResponsiveErrorStyle()}>{error}</Typography>)}
                {allItemsFetched.current && !allItemsLoading && !error && (
                  <>
                    {

                      allItems.length > 0 ? (
                        allItems.map((item, idx) => (
                          <Box key={item.name + idx} sx={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < (expandedItems ?? topItems).length - 1 ? (isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea') : 'none' }}>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 40%', textAlign: 'left' }}>{idx + 1}. {item[currentTabInfo.current.nameKey[0]]}</Typography>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 30%', textAlign: 'center' }}>{item[currentTabInfo.current.totalKey[0]]}</Typography>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 30%', textAlign: 'center' }}>{item[currentTabInfo.current.completionKey[0]] >= 0 ? `${item[currentTabInfo.current.completionKey[0]].toFixed(1)}%` : '0'}</Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" sx={getResponsiveMessageStyle()}>No data found.</Typography>
                      )
                    }
                  </>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StateAnalytics;