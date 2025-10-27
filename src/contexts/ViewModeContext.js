import React, { createContext, useContext, useState } from 'react';

const ViewModeContext = createContext();

export const useViewMode = () => {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used within ViewModeProvider');
  return ctx;
};

export const ViewModeProvider = ({ children }) => {
  const [viewMode, setViewMode] = useState('analytics'); // 'analytics' | 'ask' | 'districts' | 'pincodes'
  const [districtPanel, setDistrictPanel] = useState({ stateName: null, districtNames: [], selectedDistrictName: null });
  const [pincodePanel, setPincodePanel] = useState({ districtName: null, pincodes: [] });

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, districtPanel, setDistrictPanel, pincodePanel, setPincodePanel }}>
      {children}
    </ViewModeContext.Provider>
  );
};