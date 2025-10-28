import React, { useState } from 'react';
import { Box, Container } from '@mui/material';
import { ThemeContextProvider, useTheme } from './contexts/ThemeContext';
import { ViewModeProvider, useViewMode } from './contexts/ViewModeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import StatCards from './components/StatCards';
import MapAnalysis from './components/MapAnalysis';
import AgeBreakdown from './components/AgeBreakdown';
import StateAnalytics from './components/StateAnalytics';
import VerificationMethods from './components/VerificationMethods';
import AIChatCard from './components/AIChatCard';
import Login from './components/Login';
import './App.css';

function RightColumn() {
  const { viewMode, districtPanel, pincodePanel, setViewMode, setDistrictPanel } = useViewMode();
  const { theme } = useTheme();
  const showAnalytics = viewMode === 'analytics';
  const showAsk = viewMode === 'ask';
  const showDistricts = viewMode === 'districts';
  const showPincodes = viewMode === 'pincodes';
  // Sorting state for districts panel
  const [districtSort, setDistrictSort] = React.useState('count');

  const common = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease-out',
    willChange: 'transform, opacity'
  };

  // Prepare district names according to sorting selection
  const baseNames = districtPanel.districtNames || [];
  const districtNames = districtSort === 'alpha' ? [...baseNames].sort((a, b) => a.localeCompare(b)) : baseNames;

  return (
    <Box sx={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
      {/* Analytics stack overlay */}
      <Box
        sx={{
          ...common,
          transform: showAnalytics ? 'translate3d(0,0,0)' : 'translate3d(-20px,0,0)',
          opacity: showAnalytics ? 1 : 0,
          pointerEvents: showAnalytics ? 'auto' : 'none'
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: '0 0 20%', minHeight: 0, mb: '20px' }}>
            <AgeBreakdown />
          </Box>
          <Box sx={{ flex: '1 1 50%', minHeight: 0,mb: 0 }}>
            <StateAnalytics />
          </Box>
          <Box sx={{ flex: '0 0 30%', minHeight: 0 }}>
            <VerificationMethods />
          </Box>
        </Box>
      </Box>

      {/* Chat overlay */}
      <Box
        sx={{
          ...common,
          transform: showAsk ? 'translate3d(0,0,0)' : 'translate3d(20px,0,0)',
          opacity: showAsk ? 1 : 0,
          pointerEvents: showAsk ? 'auto' : 'none'
        }}
      >
        <Box sx={{ height: '100%' }}>
          <AIChatCard />
        </Box>
      </Box>

      {/* Districts overlay */}
      <Box
        sx={{
          ...common,
          transform: showDistricts ? 'translate3d(0,0,0)' : 'translate3d(20px,0,0)',
          opacity: showDistricts ? 1 : 0,
          pointerEvents: showDistricts ? 'auto' : 'none'
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Panel card */}
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: '8px', border: '1px solid', borderColor: theme.palette.divider, backgroundColor: theme.palette.background.paper, overflow: 'hidden' }}>
            <Box sx={{ padding: '10px 14px', borderBottom: '1px solid', borderBottomColor: theme.palette.divider, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <span style={{ fontWeight: 700, fontSize: '15px', color: theme.palette.text.primary }}>{districtPanel.stateName ? `Districts in ${districtPanel.stateName}` : 'Districts'}</span>
              </Box>
              <button onClick={() => setViewMode('analytics')} style={{
                fontSize: '16px',
                border: `1px solid ${theme.palette.divider}`,
                background: theme.palette.background.paper,
                color: theme.palette.text.primary,
                cursor: 'pointer',
                width: '28px',
                height: '28px',
                lineHeight: '24px',
                borderRadius: '6px'
              }}>×</button>
            </Box>
            {/* Sort row */}
            <Box sx={{ padding: '8px 14px', borderBottom: '1px solid', borderBottomColor: theme.palette.divider, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: theme.palette.text.secondary }}>Sort by:</span>
              <select
                value={districtSort}
                onChange={(e) => setDistrictSort(e.target.value)}
                style={{
                  fontSize: '11.5px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.palette.divider}`,
                  outline: 'none',
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                <option value="count">Pensioners Count</option>
                <option value="alpha">Alphabetically</option>
              </select>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 0.7fr 0.7fr 0.6fr', columnGap: '8px', padding: '8px 14px', borderBottom: '1px solid', borderBottomColor: theme.palette.divider }}>
              <span style={{ fontWeight: 600, fontSize: '12px', color: theme.palette.text.secondary }}>District Name</span>
              <span style={{ fontWeight: 600, fontSize: '12px', color: theme.palette.text.secondary }}>Total</span>
              <span style={{ fontWeight: 600, fontSize: '12px', color: theme.palette.text.secondary }}>Verified</span>
              <span style={{ fontWeight: 600, fontSize: '12px', color: theme.palette.text.secondary }}>Rate</span>
            </Box>
            <Box sx={{ overflowY: 'auto', padding: '4px 0' }}>
              {districtNames.map((name, idx) => (
                <Box
                  key={`${name}-${idx}`}
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1.2fr 0.7fr 0.7fr 0.6fr', 
                    columnGap: '8px', 
                    padding: '10px 14px', 
                    borderBottom: '1px solid', 
                    borderBottomColor: theme.palette.divider, 
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                  onClick={() => {
                    setDistrictPanel({ ...districtPanel, selectedDistrictName: name });
                    setViewMode('pincodes');
                  }}
                >
                  <Box sx={{ fontWeight: 700, fontSize: '12px', color: theme.palette.primary.main }}>{name}</Box>
                  <Box sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>--</Box>
                  <Box sx={{ fontSize: '12px', color: theme.palette.warning.main }}>--</Box>
                  <Box sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>--</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Pincodes overlay */}
      <Box
        sx={{
          ...common,
          transform: showPincodes ? 'translate3d(0,0,0)' : 'translate3d(20px,0,0)',
          opacity: showPincodes ? 1 : 0,
          pointerEvents: showPincodes ? 'auto' : 'none'
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Panel card */}
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: '8px', border: '1px solid', borderColor: theme.palette.divider, backgroundColor: theme.palette.background.paper, overflow: 'hidden' }}>
            <Box sx={{ padding: '10px 14px', borderBottom: '1px solid', borderBottomColor: theme.palette.divider, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <span style={{ fontWeight: 700, fontSize: '15px', color: theme.palette.text.primary }}>{districtPanel.selectedDistrictName ? `Pincodes in ${districtPanel.selectedDistrictName}` : 'Pincodes'}</span>
              </Box>
              <Box sx={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setViewMode('districts')} style={{
                  fontSize: '12px',
                  border: `1px solid ${theme.palette.divider}`,
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  cursor: 'pointer',
                  borderRadius: '6px',
                  padding: '4px 8px'
                }}>Back</button>
                <button onClick={() => setViewMode('analytics')} style={{
                  fontSize: '16px',
                  border: `1px solid ${theme.palette.divider}`,
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  cursor: 'pointer',
                  width: '28px',
                  height: '28px',
                  lineHeight: '24px',
                  borderRadius: '6px'
                }}>×</button>
              </Box>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr', columnGap: '8px', padding: '8px 14px', borderBottom: '1px solid', borderBottomColor: theme.palette.divider }}>
              <span style={{ fontWeight: 600, fontSize: '12px', color: theme.palette.text.secondary }}>Pincode</span>
              <span style={{ fontWeight: 600, fontSize: '12px', color: theme.palette.text.secondary }}>Office Name</span>
            </Box>
            <Box sx={{ overflowY: 'auto', padding: '4px 0' }}>
              {(pincodePanel.pincodes || []).map((pc, idx) => (
                <Box 
                  key={`${pc}-${idx}`} 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1.1fr 1.6fr', 
                    columnGap: '8px', 
                    padding: '10px 14px', 
                    borderBottom: '1px solid', 
                    borderBottomColor: theme.palette.divider,
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <Box sx={{ fontWeight: 700, fontSize: '12px', color: theme.palette.error.main }}>{pc}</Box>
                  <Box sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>--</Box>
                </Box>
              ))}
              {(!pincodePanel.pincodes || pincodePanel.pincodes.length === 0) && (
                <Box sx={{ padding: '12px 14px', fontSize: '12px', color: theme.palette.text.secondary }}>
                  {(pincodePanel.districtName || districtPanel.selectedDistrictName) ? 'No pincodes found for this district. Data may still be loading...' : 'Select a district to view pincodes.'}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function AppContent() {
  const { isDarkMode, theme } = useTheme();
  const { viewMode } = useViewMode();

  return (
    <Box sx={{ backgroundColor: isDarkMode ? theme.palette.background.default : '#f5f7fa', minHeight: '100vh' }}>
      <Header />

      <Container maxWidth="xl" sx={{ paddingTop: '16px', paddingBottom: '24px' }}>
        {/* Top stat cards */}
        <StatCards />

        {/* Map + Analytics section */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', alignItems: 'stretch', marginTop: '12px', minHeight: '600px' }}>
          <PaperWrapper>
            <MapAnalysis />
          </PaperWrapper>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '600px' }}>
            {/* Right column with all views */}
            <RightColumn />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

const PaperWrapper = ({ children }) => (
  <Box sx={{ backgroundColor: 'background.paper', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', padding: '8px', height: '100%' }}>
    {children}
  </Box>
);

function App() {
  return (
    <ThemeContextProvider>
      <AuthProvider>
        <ViewModeProvider>
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        </ViewModeProvider>
      </AuthProvider>
    </ThemeContextProvider>
  );
}

export default App;
