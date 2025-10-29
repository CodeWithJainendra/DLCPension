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
const StateAnalytics = () => {
  
  const tabInfo = {
    'state': { api: "https://samar.iitk.ac.in/dlc-pension-data-api/api/dashboard/top-states", leftLabel: "State / UT", nameKey: ['state'], totalKey: ['total_pensioners'], completionKey: ['verification_rate'], title:"States" },
    'PSA': { api: "https://samar.iitk.ac.in/dlc-pension-data-api/api/top-psa", leftLabel: "PSA", nameKey: ['PSA'], totalKey: ['all_pensioner_count'], completionKey: ['completion_ratio'], title:"PSAs"},
    'bank': { api: "https://samar.iitk.ac.in/dlc-pension-data-api/api/top-banks", leftLabel: "Bank", nameKey: ['bank'], totalKey: ['all_pensioner_count'], completionKey: ['completion_ratio'], title:"Banks" },
    'central_subtype': { api: "https://samar.iitk.ac.in/dlc-pension-data-api/api/psa-pensioner-types", leftLabel: "Central types", nameKey: ['central_subtype'], totalKey: ['all_pensioner_count'], completionKey: ['completion_ratio'], title:"Central" },
  }
  const middleLabel = 'Total Pensioners'
  const rightLabel = 'Completion Rate'

  const [tabValue, setTabValue] = useState(0);
  const { isDarkMode, theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedState, setSelectedState] = useState('ALL');

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
    setTabValue(newValue);
  };

  const handleShowMore = async () => {
    setIsModalOpen(true);

    // Detailed Top States
    if (tabValue === 0 && !expandedItems) {
      try {
        setPopupLoading(true);
        setError(null);
        const items = await fetchTopData(
          tabInfo["state"].api,
          {
            nameKey: ['state'],
            totalKey: ['all_pensioner_count'],
            completionKey: ['completion_ratio'],
          },
          60 * 1000, // detailed cache TTL
          null       // no limit, full list
        );
        setexpandedItems(items);
      } catch (err) {
        setError(err.message);
      } finally {
        setPopupLoading(false);
      }
    }

    // Detailed Top Banks
    if (tabValue === 1 && !expandedItems) {
      try {
        setItemsLoading(true);
        setItemsError(null);
        const items = await fetchTopData(
          tabInfo["bank"].api,
          {
            nameKey: ['bank_name'],
            totalKey: ['all_pensioner_count'],
            completionKey: ['completion_ratio'],
          },
          60 * 1000,
          null
        );
        setexpandedItems(items);
      } catch (err) {
        setItemsError(err.message);
      } finally {
        setItemsLoading(false);
      }
    }
  };

  const [popupLoading, setPopupLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);
  const [expandedItems, setexpandedItems] = useState(null);

  useEffect(() => {
    if (hasFetched.current) return;
    fetchTopStates();
    hasFetched.current = true;
  }, []);

  // Refactoring starting here.
  const [topItems, setTopItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);
  const itemsFetched = useRef(false);
  const currentTabInfo = useRef(tabInfo["state"]);


  const fetchTopData = async (
    endpoint,
    { nameKey, totalKey, completionKey },
    ttlMs = 5 * 60 * 1000,
    limit = 5
  ) => {
    const apiData = await fetchWithCache(endpoint, {}, ttlMs);

    // Accept array payloads OR object payloads where data sits in a known key
    const topItemsList = apiData["data" in apiData? "data" : "topStates"];
    console.log("Fetched top data...")
    return topItemsList;
  };

  useEffect(() => {
    // Fetch banks the first time the tab is opened
    if (tabValue === 1 && !itemsFetched.current) {
      currentTabInfo = tabInfo["bank"];
      itemsFetched.current = true;
      fetchTopBanks();
    }
    // Fetch PSAs on first open of the tab
    if (tabValue === 2 && !itemsFetched.current) {
      itemsFetched.current = true;
      currentTabInfo = tabInfo["PSA"];
      fetchTopPSAs();
    }
    // Fetch Categories on first open of the tab
    if (tabValue === 3 && !itemsFetched.current) {
      itemsFetched.current = true;
      currentTabInfo = tabInfo["central_subtype"];
      fetchTopCentralPensionSubtypes();
    }
    // Fetch Pensioner Types on first open of the tab
    if (tabValue === 4 && !itemsFetched.current) {
      itemsFetched.current = true;
      fetchTopPensionerTypes();
    }
  }, [tabValue]);

  const fetchTopStates_old = async () => {
    try {
      setItemsLoading(true);
      setError(null);

      const top_states_data = await fetchWithCache(
        tabInfo["state"].api,
        {},
        5 * 60 * 1000 // 5 minutes cache
      );

      setTopItems(top_states_data.topStates);
    } catch (err) {
      console.error('Failed to fetch top states:', err);
      setError(err.message);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchTopStates = async () => {
    try {
      console.log("Fetching top states...")
      setItemsLoading(true);
      setItemsError(null);
      const this_tabInfo = tabInfo["state"]
      const items = await fetchTopData(
        this_tabInfo.api,
        {
          nameKey: [this_tabInfo.nameKey],
          totalKey: [this_tabInfo.totalKey],
          completionKey: [this_tabInfo.completionKey]
        }
      );
      setTopItems(items);
      setItemsLoading(false);
      console.log("Loading is false..", itemsLoading.current)
    } catch (err) {
      console.error('❌ Failed to fetch top banks:', err);
      setItemsError(err.message);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchTopBanks = async () => {
    try {
      setItemsLoading(true);
      setItemsError(null);
      const this_tabInfo = tabInfo["bank"]
      const items = await fetchTopData(
        this_tabInfo.api,
        {
          nameKey: [this_tabInfo.nameKey],
          totalKey: [this_tabInfo.totalKey],
          completionKey: [this.tabInfo.completionKey]
        }
      );
      setTopItems(items);
    } catch (err) {
      console.error('❌ Failed to fetch top banks:', err);
      setItemsError(err.message);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchTopPSAs = async () => {
    try {
      setItemsLoading(true);
      setItemsError(null);
      const this_tabInfo = tabInfo["PSA"]
      const items = await fetchTopData(
        this_tabInfo.api,
        {
          nameKey: [this_tabInfo.nameKey],
          totalKey: [this_tabInfo.totalKey],
          completionKey: [this_tabInfo.completionKey]
        }
      );
      setTopItems(items);
    } catch (err) {
      console.error('❌ Failed to fetch top PSAs:', err);
      setItemsError(err.message);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchTopCentralPensionSubtypes = async () => {
    try {
      setItemsLoading(true);
      setItemsError(null);
      const this_tabInfo = tabInfo["central_subtype"]
      const items = await fetchTopData(
        this_tabInfo.api,
          {
            nameKey: [this_tabInfo.nameKey],
            totalKey: [this_tabInfo.totalKey],
            completionKey: [this_tabInfo.completionKey]
          }
        );
        setTopItems(items);
      } catch (err) {
        console.error('❌ Failed to fetch pensioner types:', err);
        setTopItems(err.message);
      } finally {
        setItemsLoading(false);
      }
    };

    const fetchTopPensionerTypes = async () => {
      try {
        setItemsLoading(true);
        setItemsError(null);
        const this_tabInfo = tabInfo["PSA"]
        const items = await fetchTopData(
          this_tabInfo.api,
          {
            nameKey: [this_tabInfo.nameKey],
            totalKey: [this_tabInfo.totalKey],
            completionKey: [this_tabInfo.completionKey]
          }
        );
        setTopItems(items);
      } catch (err) {
        console.error('❌ Failed to fetch pensioner types:', err);
        setItemsError(err.message);
      } finally {
        setItemsLoading(false);
      }
    };

    // JSX: Top PSAs tab rendering (3 columns, consistent with States/Banks)
    return (
      <>
        <Paper elevation={0} sx={{
          padding: { xs: '6px', sm: '8px', md: '5px' },
          borderRadius: '8px',
          border: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea',
          marginBottom: '100px',
          height: '250px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          backgroundColor: theme.palette.background.paper
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '5px'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '11px', sm: '12px', md: '13px' }, fontFamily: 'Inter, Roboto, Arial, sans-serif', color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTabInfo.current.title}
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
                    label={"Top" + currentTabInfo.current.title}
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
            flex: 'none',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible',
            position: 'relative' // enable overlay positioning
          }}>
            {/* Spinner overlay for the active tab */}
            {(() => {
              const isTabLoading = itemsLoading.current;
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
                
                {!itemsLoading && !error && (
                  <>
                    {console.log("top items", topItems.length)}
                    {console.log("top items", topItems)}
                    {console.log("Current tab info", currentTabInfo.current)}
                    {console.log(topItems[0][currentTabInfo.current.nameKey[0]])}
                    {console.log(topItems[0][currentTabInfo.current.totalKey[0]])}
                    {console.log(topItems[0][currentTabInfo.current.completionKey[0]])}
 
                    
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
                    {currentTabInfo.current.leftLabel}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      ...getResponsiveHeaderStyle(),
                      flex: { xs: '1 1 27%', sm: '0 0 25%' },
                      textAlign: 'center',
                    }}
                  >
                    {currentTabInfo.current.middleLabel}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      ...getResponsiveHeaderStyle(),
                      flex: { xs: '1 1 27%', sm: '0 0 25%' },
                      textAlign: 'center',
                    }}
                  >
                    {currentTabInfo.current.rightLabel}
                  </Typography>
                </Box>

                {/* Loading indicator replaced by overlay */}
                {itemsError.current && (
                  <Typography variant="body2" sx={getResponsiveErrorStyle()}>
                    {itemsError.current}
                  </Typography>
                )}
                {!itemsLoading.current && !itemsError.current && (
                  <>
                    {topItems.current.length > 0 ? (
                      topItems.current.map((item, idx) => (
                        <Box
                          key={item.name + idx}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '3px 0',
                            borderBottom:
                              idx < topItems.length - 1
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
                    {currentTabInfo.current.leftLabel}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      ...getResponsiveHeaderStyle(),
                      flex: { xs: '1 1 27%', sm: '0 0 25%' },
                      textAlign: 'center',
                    }}
                  >
                    {currentTabInfo.current.middleLabel}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      ...getResponsiveHeaderStyle(),
                      flex: { xs: '1 1 27%', sm: '0 0 25%' },
                      textAlign: 'center',
                    }}
                  >
                    {currentTabInfo.current.rightLabel}
                  </Typography>
                </Box>

                {/* Loading indicator replaced by overlay */}
                {itemsError && (
                  <Typography variant="body2" sx={getResponsiveErrorStyle()}>
                    {itemsError}
                  </Typography>
                )}
                {!itemsLoading.current && !itemsError.current && (
                  <>
                    {topItems.length > 0 ? (
                      topItems.map((item, idx) => (
                        <Box
                          key={item.name + idx}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '3px 0',
                            borderBottom:
                              idx < topItems.length - 1
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
                    {currentTabInfo.current.leftLabel}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      ...getResponsiveHeaderStyle(),
                      flex: { xs: '1 1 27%', sm: '0 0 25%' },
                      textAlign: 'center',
                    }}
                  >
                    {currentTabInfo.current.middleLabel}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      ...getResponsiveHeaderStyle(),
                      flex: { xs: '1 1 27%', sm: '0 0 25%' },
                      textAlign: 'center',
                    }}
                  >
                    {currentTabInfo.current.rightLabel}
                  </Typography>
                </Box>

                {/* Loading indicator replaced by overlay */}
                {itemsError.current && (
                  <Typography variant="body2" sx={getResponsiveErrorStyle()}>
                    {itemsError}
                  </Typography>
                )}
                {!itemsLoading.current && !itemsError.current && (
                  <>
                    {topItems.length > 0 ? (
                      topItems.map((item, idx) => (
                        <Box
                          key={item.name + idx}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '3px 0',
                            borderBottom:
                              idx < topItems.length - 1
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

        {/* <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          fullWidth
          maxWidth="sm"
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
              currentTabInfo.title
            </Typography>
/*
            {/* Filter dropdown before X */}
{/*             
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
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
              </FormControl>

              <IconButton aria-label="close" onClick={() => setIsModalOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 1 }}>
            <Box sx={{ position: 'relative', maxHeight: '50vh', overflow: 'auto' }}>
              {(() => {
                const isTabLoading =
                  tabValue === 0 ? loading :
                    tabValue === 1 ? itemsLoading :
                      tabValue === 2 ? itemsLoading :
                        tabValue === 3 ? itemsLoading :
                          tabValue === 4 ? itemsLoading : false;
                return <LoadingOverlay show={isTabLoading} />;
              })()}

              {tabValue === 0 && (
                <Box>


                  <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea' }}>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 50%', textAlign: 'left' }}>{tabInfo['state'].leftLabel}</Typography>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 25%', textAlign: 'center' }}>{middleLabel}</Typography>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 25%', textAlign: 'center' }}>{rightLabel}</Typography>
                  </Box>
                  {error && (<Typography variant="body2" sx={getResponsiveErrorStyle()}>{error}</Typography>)}
                  {!loading && !error && (
                    <>
                      {(expandedItems ?? topItems)
                        .filter((item) => selectedState === 'ALL' || item.name === selectedState).length > 0 ? (
                        (expandedItems ?? topItems)
                          .filter((item) => selectedState === 'ALL' || item.name === selectedState)
                          .map((item, idx) => (
                            <Box key={item.name + idx} sx={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < (expandedItems ?? topItems).length - 1 ? (isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea') : 'none' }}>
                              <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 50%', textAlign: 'left' }}>{idx + 1}. {item.name}</Typography>
                              <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 25%', textAlign: 'center' }}>{item.totalPensioners}</Typography>
                              <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 25%', textAlign: 'center' }}>{item.completionRate >= 0 ? `${item.completionRate.toFixed(1)}%` : '-'}</Typography>
                            </Box>
                          ))
                      ) : (
                        <Typography variant="body2" sx={getResponsiveMessageStyle()}>No data found.</Typography>
                      )}
                    </>
                  )}
                </Box>
              )}

              {tabValue === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea' }}>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 50%', textAlign: 'left' }}>{tabInfo['bank'].leftLabel}</Typography>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 25%', textAlign: 'center' }}>{middleLabel}</Typography>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 25%', textAlign: 'center' }}>{rightLabel}</Typography>
                  </Box>
                  {itemsError && (<Typography variant="body2" sx={getResponsiveErrorStyle()}>{itemsError}</Typography>)}
                  {!itemsError && !itemsError && (
                    <>
                      {(expandedItems ?? topItems).length > 0 ? (
                        (expandedItems ?? topItems).map((item, idx) => (
                          <Box key={item.name + idx} sx={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < (expandedItems ?? topItems).length - 1 ? (isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea') : 'none' }}>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 50%', textAlign: 'left' }}>{idx + 1}. {item.name}</Typography>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 25%', textAlign: 'center' }}>{item.totalPensioners}</Typography>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 25%', textAlign: 'center' }}>{item.completionRate >= 0 ? `${item.completionRate.toFixed(1)}%` : '-'}</Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" sx={getResponsiveMessageStyle()}>No data found.</Typography>
                      )}
                    </>
                  )}
                </Box>
              )}

              {tabValue === 2 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea' }}>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 50%', textAlign: 'left' }}>{tabInfo['PSA'].leftLabel}</Typography>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 25%', textAlign: 'center' }}>{middleLabel}</Typography>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 25%', textAlign: 'center' }}>{rightLabel}</Typography>
                  </Box>
                  {itemsError && (<Typography variant="body2" sx={getResponsiveErrorStyle()}>{itemsError}</Typography>)}
                  {!itemsLoading && !itemsError && (
                    <>
                      {topItems.length > 0 ? (
                        topItems.map((item, idx) => (
                          <Box key={item.name + idx} sx={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < topItems.length - 1 ? (isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea') : 'none' }}>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 50%', textAlign: 'left' }}>{idx + 1}. {item.name}</Typography>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 25%', textAlign: 'center' }}>{item.totalPensioners}</Typography>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 25%', textAlign: 'center' }}>{item.completionRate >= 0 ? `${item.completionRate.toFixed(1)}%` : '-'}</Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" sx={getResponsiveMessageStyle()}>No data found.</Typography>
                      )}
                    </>
                  )}
                </Box>
              )}

              {tabValue === 3 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea' }}>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 50%', textAlign: 'left' }}>Central types</Typography>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 25%', textAlign: 'center' }}>{middleLabel}</Typography>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 25%', textAlign: 'center' }}>{rightLabel}</Typography>
                  </Box>
                  {itemsError && (<Typography variant="body2" sx={getResponsiveErrorStyle()}>{itemsError}</Typography>)}
                  {!itemsLoading && !itemsError && (
                    <>
                      {topItems.length > 0 ? (
                        topItems.map((item, idx) => (
                          <Box key={item.name + idx} sx={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < topItems.length - 1 ? (isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea') : 'none' }}>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 50%', textAlign: 'left' }}>{idx + 1}. {item.name}</Typography>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 25%', textAlign: 'center' }}>{item.totalPensioners}</Typography>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 25%', textAlign: 'center' }}>{item.completionRate >= 0 ? `${item.completionRate.toFixed(1)}%` : '-'}</Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" sx={getResponsiveMessageStyle()}>No data found.</Typography>
                      )}
                    </>
                  )}
                </Box>
              )}

              {tabValue === 4 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea' }}>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 50%', textAlign: 'left' }}>Pensioner types</Typography>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 25%', textAlign: 'center' }}>{middleLabel}</Typography>
                    <Typography variant="body2" sx={{ ...getResponsiveHeaderStyle(), flex: '0 0 25%', textAlign: 'center' }}>{rightLabel}</Typography>
                  </Box>
                  {itemsError && (<Typography variant="body2" sx={getResponsiveErrorStyle()}>{itemsError}</Typography>)}
                  {!itemsLoading && !itemsError && (
                    <>
                      {topItems.length > 0 ? (
                        topItems.map((item, idx) => (
                          <Box key={item.name + idx} sx={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < topItems.length - 1 ? (isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea') : 'none' }}>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 50%', textAlign: 'left' }}>{idx + 1}. {item.name}</Typography>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 25%', textAlign: 'center' }}>{item.totalPensioners}</Typography>
                            <Typography variant="body2" sx={{ ...getResponsiveDataStyle(), flex: '0 0 25%', textAlign: 'center' }}>{item.completionRate >= 0 ? `${item.completionRate.toFixed(1)}%` : '-'}</Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" sx={getResponsiveMessageStyle()}>No data found.</Typography>
                      )}
                    </>
                  )}
                </Box>
              )}
            </Box>
          </DialogContent>
        </Dialog> */} */
      </>
    );
  };

  export default StateAnalytics;