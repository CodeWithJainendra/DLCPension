import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { MapContainer, GeoJSON, ZoomControl, useMap } from 'react-leaflet';
import indiaStatesUrl from '../IndiaMap/INDIA_STATES.geojson';
import indiaDistrictsUrl from '../IndiaMap/INDIA_DISTRICTS.geojson';
import indiaPincodesUrl from '../IndiaMap/INDIAN_PINCODE_BOUNDARY.geojson';
import { useTheme } from '../contexts/ThemeContext';
import { useViewMode } from '../contexts/ViewModeContext';
import L from 'leaflet';

// Known Indian states/UTs to help detect names from various schemas
const KNOWN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','NCT of Delhi','Jammu and Kashmir','Ladakh','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Lakshadweep','Puducherry'
];

const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

// Helper component to set map ref
function SetMapRef({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    // console.log('[Map] Map ref set:', !!map);
  }, [map, mapRef]);
  return null;
}

const MapAnalysis = ({ onOpenFilter, filters, refreshKey }) => {
  const {isDarkMode, theme } = useTheme();
  const {viewMode, setViewMode, setDistrictPanel, districtPanel, setPincodePanel } = useViewMode();
  const [statesData, setStatesData] = useState(null);
  const [districtsData, setDistrictsData] = useState(null);
  const [pincodesData, setPincodesData] = useState(null);
  const [pincodesInDistrict, setPincodesInDistrict] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [viewLevel, setViewLevel] = useState('country'); // 'country' | 'state'
  const [selectedStateName, setSelectedStateName] = useState(null);
  const mapRef = useRef(null);
  const [showAllLegend, setShowAllLegend] = useState(false);
  const [showBanks, setShowBanks] = useState(false);
  const [isPincodeDataLoaded, setIsPincodeDataLoaded] = useState(false);
  

  const handleFilterIconClick = () => {
    console.log("Map: Open filter clicked")
    onOpenFilter();
    // Open the FilterComponent modal
  }

  useEffect(() => {
    //TODO: map filter pending
    console.log("Map needs to be refreshed with new data:", filters, refreshKey);
  }, [filters, refreshKey]);

  useEffect(() => {
    // Load states
    fetch(indiaStatesUrl)
      .then((res) => res.json())
      .then((data) => {
        setStatesData(data);
        setGeoData(data);
        setTimeout(() => {
          const map = mapRef.current;
          if (!map) return;
          map.setView([22.9734, 78.6569], 4);
          map.invalidateSize();
        }, 0);
      })
      .catch((err) => {
        console.error('Failed to load INDIA_STATES.geojson', err);
      });

    // Load districts
    fetch(indiaDistrictsUrl)
      .then((res) => res.json())
      .then((data) => {
        setDistrictsData(data);
      })
      .catch((err) => {
      });

    // Load pincodes (heavy)
    fetch(indiaPincodesUrl)
      .then((res) => res.json())
      .then((data) => {
        setPincodesData(data);
        setIsPincodeDataLoaded(true);
      })
      .catch((err) => {
        setIsPincodeDataLoaded(false);
      });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const map = mapRef.current;
      if (map) map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide/Reset Show Banks when leaving districts/pincodes
  useEffect(() => {
    if (viewMode !== 'districts' && viewMode !== 'pincodes') {
      setShowBanks(false);
    }
  }, [viewMode]);

  // Open pincodes when a district is selected from the right-side list
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const selected = districtPanel?.selectedDistrictName;
    if (viewLevel === 'state' && selected) {
      try {
        // Ensure base datasets are loaded
        if (!geoData || !pincodesData || !pincodesData.features || pincodesData.features.length === 0) {
          // Show a message to the user
          setPincodePanel({ districtName: selected, pincodes: [] });
          return;
        }
       
        // Active state from panel or local selection
        const activeState = districtPanel?.stateName || selectedStateName;
      
        // Try to find the district in the current geoData (per-state districts)
        let feature = (geoData.features || []).find((f) => {
          const distName = getDistrictName(f.properties || {});
          const match = normalize(distName) === normalize(selected);
          return match;
        });
        
        
        // Fallback: find in global districts by name and current state (if known)
        if (!feature && districtsData) {
          const candidates = (districtsData.features || []).filter((f) => {
            const props = f.properties || {};
            const distName = getDistrictName(props);
            const nameMatch = normalize(distName) === normalize(selected) ||
                              distName?.toLowerCase().includes(String(selected).toLowerCase());
            if (!nameMatch) return false;
            // If we know the state, enforce it; else accept name-only match
            return activeState ? districtMatchesState(props, activeState) : true;
          });
          if (candidates.length) feature = candidates[0];
        }
        
        if (!feature) {
          console.warn('[Map] No feature found for district:', selected, 'in state:', activeState);
          console.log('[Map] Available districts in geoData:', (geoData.features || []).map(f => getDistrictName(f.properties || {})));
          return;
        }
        
        const distBounds = L.geoJSON(feature).getBounds();
       
        let filtered = (pincodesData.features || []).filter((pf) => {
          try {
            const pbounds = L.geoJSON(pf).getBounds();
            const center = pbounds.getCenter();
            return distBounds.contains(center);
          } catch (e) {
            return false;
          }
        });
        
        
        if (!filtered.length) {
          filtered = (pincodesData.features || []).filter((pf) => {
            try {
              const pbounds = L.geoJSON(pf).getBounds();
              return distBounds.intersects(pbounds);
            } catch (e) {
              return false;
            }
          });
        }
        
        const fc = { type: 'FeatureCollection', features: filtered };
        setPincodesInDistrict(fc);
        if (viewMode !== 'pincodes') setViewMode('pincodes');
        const pincodeList = filtered.map((pf) => String(pf.properties?.Pincode || ''));
        setPincodePanel({ districtName: selected, pincodes: pincodeList });
        map.invalidateSize();
        
        if (filtered.length > 0) {
          setTimeout(() => {
            const layerBounds = L.geoJSON(fc).getBounds();
            fitBoundsSmart(map, layerBounds, { padding: [80, 80], maxZoom: 15, duration: 0.9 });
          }, 50);
        } else {
          console.warn('[Map] No pincodes to display for district:', selected);
        }
      } catch (e) {
        console.error('[Map] Failed to compute pincodes from list click', selected, e);
      }
    }
  }, [viewLevel, viewMode, districtPanel?.selectedDistrictName, pincodesData, geoData, districtsData, selectedStateName, districtPanel?.stateName]);

  // Enforce zoom based on view changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (viewLevel === 'state' && viewMode === 'districts') {
      if (geoData?.features?.length) {
        try {
          const layer = L.geoJSON(geoData);
          const bounds = layer.getBounds();
          map.invalidateSize();
          setTimeout(() => {
            fitBoundsSmart(map, bounds, { padding: [30, 30], maxZoom: 9, duration: 0.9 });
          }, 50);
        } catch {}
      }
    } else if (viewLevel === 'country' && viewMode !== 'pincodes') {
      try {
        map.flyTo([22.9734, 78.6569], 4, { duration: 0.8, animate: true });
      } catch {
        map.setView([22.9734, 78.6569], 4);
      }
    }
  }, [viewLevel, viewMode, selectedStateName, geoData]);

  const stateStyle = {
    color: '#2e3a4d',
    weight: 2,
    fillColor: '#eef2f7',
    fillOpacity: 0.9,
  };

  const districtStyle = {
    color: '#455a64',
    weight: 2.5,
    fillColor: '#f7fafc',
    fillOpacity: 0.8,
  };

  const getStateName = (feature) => {
    const props = feature?.properties || {};
    const candidateKeys = ['STNAME','STNAME_SH','STATE_NAME','STATE','ST_NM','STATENAME','State','NAME_1','NAME'];
    for (const k of candidateKeys) {
      if (props[k]) return props[k];
    }
    // Try values that match known states
    for (const v of Object.values(props)) {
      if (KNOWN_STATES.some((st) => normalize(v) === normalize(st))) return v;
    }
    return 'Unknown State';
  };

  const SYNONYMS = {
    nctofdelhi: 'delhi',
    delhi: 'delhi',
    uttaranchal: 'uttarakhand',
    orissa: 'odisha',
    andamanandnicobarislands: 'andamanandnicobarislands',
    dadraandnagarhavelianddamananddiu: 'dadraandnagarhavelianddamananddiu'
  };

  const canon = (s) => {
    const n = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    return SYNONYMS[n] || n;
  };
  
  // Replace fuzzy districtMatchesState with strict canonical equality
  const districtMatchesState = (props, stateName) => {
    if (!props || !stateName) return false;
    const cs = canon(stateName);
    const keysPreferred = ['ST_NM','st_nm','STATE_NAME','STATE','STNAME','STATE/UT','STATE_UT','STATEUT','State','stname'];
    for (const key of keysPreferred) {
      if (key in props && props[key]) {
        if (canon(props[key]) === cs) return true;
      }
    }
    // Fallback: only keys that explicitly denote state; avoid matching DISTRICT
    for (const [k, v] of Object.entries(props)) {
      if ((/state/i.test(k) || /^st(_?nm|name)$/i.test(k)) && v) {
        if (canon(v) === cs) return true;
      }
    }
    return false;
  };

  const getDistrictName = (props) => {
    const preferred = [
      'DISTNAME', 'DISTRICT', 'DTNAME', 'DIST_NAME', 'DISTRICT_NAME', 'DIST_NM', 'DISTRICT_N',
      'NAME', 'NAME_1', 'NAME_2', 'district', 'distname', 'dtname'
    ];
    for (const k of preferred) {
      if (props?.[k]) return props[k];
    }
    // Heuristic: any property key that hints "district"
    for (const [k, v] of Object.entries(props || {})) {
      if (typeof v === 'string' && /dist|dt/i.test(k) && !/state/i.test(k)) {
        return v;
      }
    }
    // Fallback: pick first string property value
    for (const v of Object.values(props || {})) {
      if (typeof v === 'string' && v.trim()) return v;
    }
    return 'District';
  };

  const filterDistrictsForState = (stateFeature, districts) => {
    const stateName = getStateName(stateFeature);
    let filtered = (districts.features || []).filter((f) => districtMatchesState(f.properties, stateName));
    const propCount = filtered.length;
    // If property filter fails (0) or is clearly wrong (too many), use spatial fallback by center-in-bounds
    if (!filtered.length || filtered.length > 150) {
      try {
        const stateLayer = L.geoJSON(stateFeature);
        const stateBounds = stateLayer.getBounds();
        filtered = (districts.features || []).filter((df) => {
          try {
            const dbounds = L.geoJSON(df).getBounds();
            const center = dbounds.getCenter();
            return stateBounds.contains(center);
          } catch (e) {
            return false;
          }
        });
      } catch (e) {}
    }
    const centerCount = filtered.length;
    // If still none, do a looser bounds intersection fallback
    if (!filtered.length) {
      try {
        const stateLayer = L.geoJSON(stateFeature);
        const stateBounds = stateLayer.getBounds();
        filtered = (districts.features || []).filter((df) => {
          try {
            const dbounds = L.geoJSON(df).getBounds();
            return stateBounds.intersects(dbounds);
          } catch (e) {
            return false;
          }
        });
      } catch (e) {}
    }
    return filtered;
  };

  // Build a dynamic map of per-state district files using webpack require.context
  // This scans ../IndiaMap/STATES/** for files ending in _DISTRICTS.geojson
  const districtsContext = require.context('../IndiaMap/STATES', true, /_DISTRICTS\.geojson$/);
  const DISTRICT_FILE_MAP = (() => {
  const map = {};
  const canon = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  districtsContext.keys().forEach((key) => {
  // key looks like './UTTAR PRADESH/UTTAR PRADESH_DISTRICTS.geojson'
  const parts = key.split('/');
  const folder = parts.length > 2 ? parts[1] : '';
  const filename = parts[parts.length - 1].replace('_DISTRICTS.geojson', '');
  [folder, filename].forEach((candidate) => {
  if (candidate) map[canon(candidate)] = key;
  });
  });
  return map;
  })();

  // Helper: animated fly-to-bounds with padding for nice zoom effect
  const fitBoundsSmart = (map, bounds, opts = {}) => {
    if (!map || !bounds) return;
    const { padding = [60, 60], maxZoom = 14, duration = 0.8 } = opts;
    try {
      map.flyToBounds(bounds, { padding, maxZoom, duration, animate: true });
    } catch (e) {
      try {
        const center = bounds.getCenter();
        const zoom = Math.min(map.getBoundsZoom(bounds), maxZoom);
        map.flyTo(center, zoom, { duration, animate: true });
      } catch (err) {
        const center = bounds.getCenter();
        map.setView(center, maxZoom);
      }
    }
    // Ensure map reflows correctly after animation/init
    setTimeout(() => {
      try { map.invalidateSize(); } catch {}
    }, 120);
  };

  // Reusable: open a state's districts view by name
  const openStateView = (stateName) => {
    if (!stateName) return;
    const key = DISTRICT_FILE_MAP[normalize(stateName)];
    const map = mapRef.current;

    const applyDistricts = (data) => {
      setGeoData(data);
      setViewLevel('state');
      const districtNames = (data.features || []).map((f) => getDistrictName(f.properties || {}));
      setViewMode('districts');
      setDistrictPanel({ stateName, districtNames, selectedDistrictName: null });
      setPincodesInDistrict(null);
      setPincodePanel({ districtName: null, pincodes: [] });
      if (map && data?.features?.length) {
        const layer = L.geoJSON(data);
        const bounds = layer.getBounds();
        map.invalidateSize();
        setTimeout(() => {
            // Zoom to fit the state's districts with maximum visibility
            fitBoundsSmart(map, bounds, { padding: [30, 30], maxZoom: 9, duration: 0.9 });
          }, 50);
      }
    };

    if (key) {
      try {
        const url = districtsContext(key);
        fetch(url)
          .then((res) => res.json())
          .then((data) => {
            applyDistricts(data);
          })
          .catch((err) => {
            console.warn(`[Map] Failed to load per-state districts for ${stateName} via ${key}`, err);
            // Fallback to global districts
            if (!districtsData) return;
            const filtered = (districtsData.features || []).filter((f) => districtMatchesState(f.properties, stateName));
            const fc = { type: 'FeatureCollection', features: filtered };
            applyDistricts(fc);
          });
        return;
      } catch (e) {
        console.warn(`[Map] Error resolving districts file for ${stateName} via ${key}`, e);
      }
    }
    // Fallback to global districts filtering if per-state file not found
    if (!districtsData) return;
    const filtered = (districtsData.features || []).filter((f) => districtMatchesState(f.properties, stateName));
    const fc = { type: 'FeatureCollection', features: filtered };
    applyDistricts(fc);
  };

  const onEachStateFeature = (feature, layer) => {
    const stateName = getStateName(feature);
    layer.on({
      mouseover: (e) => {
        layer.setStyle({ weight: 3, fillOpacity: 1 });
        const content = `
          <div class="state-hover-card">
            <div class="state-card-title">${stateName}</div>
            <div class="state-card-value">---</div>
          </div>
        `;
        layer
          .bindTooltip(content, {
            sticky: true,
            direction: 'top',
            opacity: 1,
            className: 'state-hover-tooltip',
          })
          .openTooltip(e.latlng);
      },
      mouseout: () => {
        layer.setStyle(stateStyle);
        layer.closeTooltip();
      },
      click: () => {
        setSelectedStateName(stateName);
        openStateView(stateName);
      },
    });
  };

  const onEachDistrictFeature = (feature, layer) => {
    const districtName = getDistrictName(feature?.properties || {});
    layer.on({
      mouseover: (e) => {
        const title = `${districtName}`;
        const content = `
            <div class="state-hover-card">
              <div class="state-card-title">${title}</div>
              <div class="state-card-value">---</div>
            </div>
          `;
        layer
          .bindTooltip(content, {
            sticky: true,
            direction: 'top',
            opacity: 1,
            className: 'state-hover-tooltip',
          })
          .openTooltip(e.latlng);
      },
      mouseout: () => {
        layer.closeTooltip();
      },
      click: () => {
        // When a district is clicked, compute pincodes within it
        try {
          if (!pincodesData) return;
          const distLayer = L.geoJSON(feature);
          const distBounds = distLayer.getBounds();
          let filtered = (pincodesData.features || []).filter((pf) => {
            try {
              const pbounds = L.geoJSON(pf).getBounds();
              const center = pbounds.getCenter();
              return distBounds.contains(center);
            } catch (e) {
              return false;
            }
          });
          if (!filtered.length) {
            filtered = (pincodesData.features || []).filter((pf) => {
              try {
                const pbounds = L.geoJSON(pf).getBounds();
                return distBounds.intersects(pbounds);
              } catch (e) {
                return false;
              }
            });
          }
          const fc = { type: 'FeatureCollection', features: filtered };
          setPincodesInDistrict(fc);
          setViewMode('pincodes');
          setDistrictPanel((prev) => ({ ...prev, selectedDistrictName: districtName }));
          const pincodeList = filtered.map((pf) => String(pf.properties?.Pincode || ''));
          setPincodePanel({ districtName, pincodes: pincodeList });
          const map = mapRef.current;
          if (map && filtered.length) {
            const layerBounds = L.geoJSON(fc).getBounds();
            map.invalidateSize();
            setTimeout(() => {
              // Animate zoom to bounds of pincodes for best visibility
              fitBoundsSmart(map, layerBounds, { padding: [80, 80], maxZoom: 15, duration: 0.9 });
            }, 50);
          }
        } catch (e) {
          console.warn('[Map] Failed to compute pincodes for district', districtName, e);
        }
      }
    });
  };

  // Pincode feature hover: show tooltip with pincode number
  const onEachPincodeFeature = (feature, layer) => {
    const pin = String(feature?.properties?.Pincode || '').trim();
    const title = pin ? `Pincode: ${pin}` : 'Pincode';
    layer.on({
      mouseover: (e) => {
        const content = `
          <div class="state-hover-card">
            <div class="state-card-title">${title}</div>
            <div class="state-card-value">Area boundary</div>
          </div>
        `;
        layer
          .bindTooltip(content, {
            sticky: true,
            direction: 'top',
            opacity: 1,
            className: 'state-hover-tooltip',
          })
          .openTooltip(e.latlng);
      },
      mouseout: () => {
        layer.closeTooltip();
      },
    });
  };

  const resetToCountry = () => {
    if (statesData) {
      setGeoData(statesData);
      setViewLevel('country');
      setSelectedStateName(null);
      setViewMode('analytics');
      setDistrictPanel({ stateName: null, districtNames: [], selectedDistrictName: null });
      setPincodesInDistrict(null);
      setPincodePanel({ districtName: null, pincodes: [] });
      const map = mapRef.current;
      if (map) {
        try {
          map.flyTo([22.9734, 78.6569], 4, { duration: 0.8, animate: true });
        } catch (e) {
          map.setView([22.9734, 78.6569], 4);
        }
        setTimeout(() => {
          try { map.invalidateSize(); } catch {}
        }, 120);
      }
    }
  };

  const baseLegend = [
    { label: '400K+', color: '#0d47a1' },
    { label: '300K - 400K', color: '#1565c0' },
    { label: '200K - 300K', color: '#1e88e5' },
    { label: '150K - 200K', color: '#2979ff' },
    { label: '100K - 150K', color: '#42a5f5' },
  ];
  const extraLegend = [
    { label: '50K - 100K', color: '#64b5f6' },
    { label: '10K - 50K', color: '#90caf9' },
    { label: '1 - 10K', color: '#bbdefb' },
    { label: 'No Data (0)', color: '#e0e0e0' },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #eaeaea',
        marginBottom: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        flex: 1,
        backgroundColor: '#fff',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '15px' }}>
          Map Analysis
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(viewMode === 'districts' || viewMode === 'pincodes') && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '12px', color: theme.palette.text.primary }}>
                <input
                  type="checkbox"
                  checked={showBanks}
                  onChange={(e) => setShowBanks(e.target.checked)}
                  style={{ marginRight: '6px' }}
                />
                Show Banks
              </label>
            </Box>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<FilterAltIcon />}
            onClick={onOpenFilter}
            sx={{
              backgroundColor: '#2196f3',
              textTransform: 'none',
              boxShadow: 'none',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '6px',
              minWidth: '72px',
              height: '28px',
              '& .MuiButton-startIcon': { marginRight: '6px' },
              '&:hover': {
                backgroundColor: '#1976d2',
                boxShadow: 'none',
              },
            }}
          >
            Filter
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          flex: 1,
          minHeight: '500px',
          maxHeight: '500px',
          backgroundColor: 'transparent',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        {/* Top-left breadcrumb */}
        <Box sx={{ position: 'absolute', top: '8px', left: '8px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Box
            onClick={resetToCountry}
            sx={{
              backgroundColor: isDarkMode ? theme.palette.background.paper : '#e3f2fd',
              border: isDarkMode ? '1px solid #415A77' : '1px solid #90caf9',
              color: isDarkMode ? theme.palette.text.primary : '#1976d2',
              borderRadius: '8px',
              padding: '2px 8px',
              fontSize: '11px',
              cursor: viewLevel === 'state' || viewMode === 'pincodes' ? 'pointer' : 'default',
              userSelect: 'none',
            }}
          >
            India
          </Box>
          {!districtsData && (
            <Box sx={{
              backgroundColor: isDarkMode ? theme.palette.background.paper : '#fffbe6',
              border: isDarkMode ? '1px solid #415A77' : '1px solid #ffe58f',
              color: isDarkMode ? theme.palette.text.primary : '#ad6800',
              borderRadius: '8px',
              padding: '2px 8px',
              fontSize: '11px'
            }}>
              Loading districts…
            </Box>
          )}
          {viewLevel === 'state' && (
            <Box
              onClick={() => openStateView(selectedStateName)}
              sx={{
                backgroundColor: isDarkMode ? theme.palette.background.paper : '#f1f8ff',
                border: isDarkMode ? '1px solid #415A77' : '1px solid #a9d6ff',
                color: isDarkMode ? theme.palette.text.primary : '#1565c0',
                borderRadius: '8px',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              › {selectedStateName}
            </Box>
          )}
          {viewMode === 'pincodes' && districtPanel.selectedDistrictName && (
            <Box sx={{
              backgroundColor: isDarkMode ? theme.palette.background.paper : '#f1f8ff',
              border: isDarkMode ? '1px solid #415A77' : '1px solid #a9d6ff',
              color: isDarkMode ? theme.palette.text.primary : '#D32F2F',
              borderRadius: '8px',
              padding: '2px 8px',
              fontSize: '11px'
            }}>
              › {districtPanel.selectedDistrictName} (Pincodes)
            </Box>
          )}
        </Box>

        <MapContainer
          center={[22.9734, 78.6569]}
          zoom={4}
          minZoom={3}
          maxZoom={18}
          zoomControl={false}
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}
          className={viewMode === 'pincodes' ? 'pincode-view' : (viewLevel === 'state' ? 'district-view' : '')}
        >
          <SetMapRef mapRef={mapRef} />
          {geoData && viewMode !== 'pincodes' && (
            <GeoJSON
              key={viewLevel === 'state' ? `dist-${selectedStateName || 'unknown'}` : 'states'}
              data={geoData}
              style={viewLevel === 'state' ? districtStyle : stateStyle}
              onEachFeature={viewLevel === 'state' ? onEachDistrictFeature : onEachStateFeature}
            />
          )}
          {/* Pincode overlay when a district is selected */}
          {viewMode === 'pincodes' && pincodesInDistrict && (
            <GeoJSON
              key={`pincodes-${districtPanel.selectedDistrictName || 'none'}`}
              data={pincodesInDistrict}
              style={() => ({ color: '#D32F2F', weight: 1, fillOpacity: 0.2 })}
              onEachFeature={onEachPincodeFeature}
            />
          )}
          <ZoomControl position="topright" />
        </MapContainer>

        {/* Floating bottom-left legend */}
        <Box
          sx={{
            position: 'absolute',
            left: '8px',
            bottom: '8px',
            backgroundColor: theme.palette.background.paper,
            border: isDarkMode ? '1px solid #415A77' : '1px solid #eaeaea',
            borderRadius: '8px',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
            padding: '8px 10px',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 600,
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
            }}
          >
            {viewMode === 'pincodes' ? 'Pincode Areas' : (viewLevel === 'state' ? 'Pensioners Count (Districts)' : 'Pensioners Count (States)')}
          </Typography>
          {viewMode !== 'pincodes' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {baseLegend.map((item) => (
                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: item.color,
                      marginRight: '6px',
                      borderRadius: '3px',
                    }}
                  />
                  <Typography variant="body2" sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
              {showAllLegend &&
                extraLegend.map((item) => (
                  <Box key={item.label} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: '10px',
                        height: '10px',
                        backgroundColor: item.color,
                        marginRight: '6px',
                        borderRadius: '3px',
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: '11px', color: theme.palette.text.primary }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                <Button
                  onClick={() => setShowAllLegend((s) => !s)}
                  size="small"
                  sx={{ textTransform: 'none', fontSize: '11px', color: isDarkMode ? '#3A86FF' : '#1e88e5', padding: 0, minWidth: 0 }}
                >
                  {showAllLegend ? '▼ Less' : '▲ More'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>


        {/* Districts panel moved to RightColumn; nothing renders inside the map container now. */}
      </Box>
    </Paper>
  );
};

export default MapAnalysis;