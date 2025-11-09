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
import { fetchWithCache } from '../utils/cache';

// Known Indian states/UTs to help detect names from various schemas
const KNOWN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'NCT of Delhi', 'Jammu and Kashmir', 'Ladakh', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep', 'Puducherry'
];

const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

// Helper component to set map ref
function SetMapRef({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

const MapAnalysis = ({ onOpenFilter, filters, refreshKey, onUpdateFilterViaMapContext }) => {

  const geoStatsUrl = 'https://cdis.iitk.ac.in/dlc-backend/api/geo-stats';
  const { isDarkMode, theme } = useTheme();
  const { viewMode, setViewMode, districtPanel, setDistrictPanel, pincodePanel, setPincodePanel } = useViewMode();
  const [statesData, setStatesData] = useState(null);
  const [districtsData, setDistrictsData] = useState(null);
  const [pincodesData, setPincodesData] = useState(null);
  const [pincodesInDistrict, setPincodesInDistrict] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [geoStats, setGeoStats] = useState(null);
  const [viewLevel, setViewLevel] = useState('country'); // 'country' | 'state'
  const [selectedStateName, setSelectedStateName] = useState(null);
  const mapRef = useRef(null);
  const [isPincodeDataLoaded, setIsPincodeDataLoaded] = useState(false);
  const [geoDataLoading, setGeoDataLoading] = useState(false);
  const [geoStatsLoading, setGeoStatsLoading] = useState(false);


  const _makeAPICallOrFetchFromCache = async (endpoint, params, ttlMs = 5 * 60 * 1000) => {
    const apiData = await fetchWithCache(endpoint, params, ttlMs);
    const featureStats = apiData["data"];
    return featureStats;
  };

  const updateRightPanelData = (level, data) => {
    if (level === 'country') {
    }
    if (level === 'state') {
      setDistrictPanel((prev) => ({ ...prev, data: data || [] }));
      console.log('[geo-stats] set district panel data:', districtPanel);
    }
    if (level === 'district') {
      setPincodePanel((prev) => ({ ...prev, data: data || [] }));
      console.log('[geo-stats] set pincode panel data:', pincodePanel);
    }
  }

  const fetchGeoStats = async (level, name, filters) => {
    try {
      setGeoStatsLoading(true);
      console.log('[geo-stats] fetching for', level, name, filters);
      const params = { level, name, filters };
      const data = await _makeAPICallOrFetchFromCache(geoStatsUrl, params, 5 * 60 * 1000);
      console.log('[geo-stats] fetched data:', data);
      setGeoStats(Array.isArray(data) ? data : data.geoStats || []);

      updateRightPanelData(level, data.geoStats || []);

      setGeoStatsLoading(false);
    } catch (err) {
      console.error('[geo-stats] failed:', err);
      setGeoStats([]);
      setGeoStatsLoading(false);
    }
  };


  useEffect(() => {
    setGeoDataLoading(true);

    const loadStates = fetch(indiaStatesUrl)
      .then((res) => res.json())
      .then((data) => {
        setStatesData(data);
        setGeoData(data);
        console.log('[Map] Loaded INDIA_STATES.geojson with', data.features?.length || 0, 'features');
        setTimeout(() => {
          const map = mapRef.current;
          if (map) {
            map.setView([22.9734, 78.6569], 4);
            map.invalidateSize();
          }
        }, 0);
      });

    const loadDistricts = fetch(indiaDistrictsUrl)
      .then((res) => res.json())
      .then((data) => {
        setDistrictsData(data);
        console.log('[Map] Loaded INDIA_DISTRICTS.geojson with', data.features?.length || 0, 'features');
      });

    const loadPincodes = fetch(indiaPincodesUrl)
      .then((res) => res.json())
      .then((data) => {
        setPincodesData(data);
        setIsPincodeDataLoaded(true);
        console.log('[Map] Loaded INDIAN_PINCODE_BOUNDARY.geojson with', data.features?.length || 0, 'features');
      })
      .catch((err) => {
        console.error('Failed to load INDIAN_PINCODE_BOUNDARY.geojson', err);
        setIsPincodeDataLoaded(false);
      });

    Promise.allSettled([loadStates, loadDistricts, loadPincodes])
      .finally(() => {
        setGeoDataLoading(false);
      });
  }, []);

  // Recolor and update legend dynamically when data_status changes
  useEffect(() => {
    if (!geoStats || geoStats.length === 0) return;

    const map = mapRef.current;
    if (!map) return;

    console.log('[Map] Updating map colors based on data_status:', filters.data_status);

    map.eachLayer((layer) => {
      // Only recolor GeoJSON vector layers
      if (layer.feature && layer.setStyle) {
        const newStyle = getFeatureStyle(layer.feature, geoStats, filters, lowest, highest);
        layer.setStyle(newStyle);
      }
    });
    // Optionally force a slight reflow
    map.invalidateSize();
  }, [filters.data_status, geoStats]);


  useEffect(() => {
    const handleResize = () => {
      const map = mapRef.current;
      if (map) map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            fitBoundsSmart(map, bounds, { padding: [40, 40], maxZoom: 9, duration: 1 });
          }, 100);
        } catch { }
      }
    } else if (viewLevel === 'country' && viewMode !== 'pincodes') {
      try {
        map.flyTo([22.9734, 78.6569], 4, { duration: 0.8, animate: true });
      } catch {
        map.setView([22.9734, 78.6569], 4);
      }
    }
  }, [viewLevel, viewMode, selectedStateName, geoData]);


  // Country-level geoStats
  useEffect(() => {
    if (!statesData || !districtsData || !isPincodeDataLoaded) return;
    if (viewLevel === 'country') {
      fetchGeoStats('country', null, filters);
    }
  }, [viewLevel, statesData, districtsData, isPincodeDataLoaded, filters, refreshKey]);

  // State-level geoStats
  useEffect(() => {
    if (!statesData || !districtsData || !isPincodeDataLoaded) return;
    if (viewLevel === 'state' && selectedStateName) {
      fetchGeoStats('state', selectedStateName, filters);
    }
  }, [viewLevel, selectedStateName, statesData, districtsData, isPincodeDataLoaded, filters, refreshKey]);

  // District-level geoStats
  useEffect(() => {
    if (!statesData || !districtsData || !isPincodeDataLoaded) return;
    if (viewLevel === 'district' && districtPanel?.selectedDistrictName) {
      fetchGeoStats('district', districtPanel.selectedDistrictName, filters);
    }
  }, [viewLevel, districtPanel?.selectedDistrictName, statesData, districtsData, isPincodeDataLoaded, filters, refreshKey]);


  /*
  useEffect(() => {
    if (!statesData || !districtsData || !isPincodeDataLoaded) return;
    const featureName = viewLevel === 'state' ? selectedStateName
      : viewLevel === 'district' ? districtPanel.selectedDistrictName
        : null
    fetchGeoStats(viewLevel, featureName, filters);
  }, [statesData, districtsData, isPincodeDataLoaded, filters, refreshKey, viewMode, viewLevel,
    selectedStateName, districtPanel?.selectedDistrictName]);

    */

  const getStateName = (feature) => {
    const props = feature?.properties || {};
    const candidateKeys = ['STNAME', 'STNAME_SH', 'STATE_NAME', 'STATE', 'ST_NM', 'STATENAME', 'State', 'NAME_1', 'NAME'];
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
    const keysPreferred = ['ST_NM', 'st_nm', 'STATE_NAME', 'STATE', 'STNAME', 'STATE/UT', 'STATE_UT', 'STATEUT', 'State', 'stname'];
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
      try { map.invalidateSize(); } catch { }
    }, 120);
  };

  const openStateView = (stateName) => {
    if (!stateName) return;
    if (!districtsData) return;
    setViewLevel('state');
    onUpdateFilterViaMapContext({ district: null, state: stateName });

    try {
      if (!districtsData) return;
      const filtered = (districtsData.features || []).filter(
        (f) => districtMatchesState(f.properties, stateName));
      const fc = { type: 'FeatureCollection', features: filtered };
      setGeoData(fc);
      const districtNames = (fc.features || []).map((f) => getDistrictName(f.properties || {}));

      setViewMode('districts');
      setDistrictPanel({ stateName, districtNames, selectedDistrictName: null, data: [] });
      // setPincodesInDistrict(null);

      setPincodePanel({ districtName: null, pincodes: [], data: [] });

      const map = mapRef.current;
      if (map && fc?.features?.length) {
        const layer = L.geoJSON(fc);
        const bounds = layer.getBounds();
        map.invalidateSize();
        setTimeout(() => {
          // Zoom to fit the state's districts with maximum visibility
          fitBoundsSmart(map, bounds, { padding: [30, 30], maxZoom: 9, duration: 0.9 });
        }, 50);
      }
    }
    catch (e) {
      console.warn(`[Map] Error resolving districts for ${stateName}`, e);
      return;
    }
  };


  const onEachStateFeature = (feature, layer) => {
    if (!geoStats || !Array.isArray(geoStats) || geoStats.length === 0) return;
    const stateName = getStateName(feature);
    const stats = geoStats.find(gs => gs.name.toLowerCase() === stateName.toLowerCase()) || {};
    layer.on({
      mouseover: (e) => {
        layer.setStyle({ weight: 3, fillOpacity: 1 });
        const content = buildHoverTooltip(stateName, stats);
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
        layer.setStyle(getFeatureStyle(feature, geoStats, filters, lowest, highest));
        layer.closeTooltip();
      },
      click: () => {
        setViewLevel('state');
        if (!districtsData) return;
        setSelectedStateName(stateName);
        onUpdateFilterViaMapContext({ state: stateName, district: null });
        openStateView(stateName);
      },
    });
  };

  const onEachDistrictFeature = (feature, layer) => {
    if (!geoStats || !Array.isArray(geoStats) || geoStats.length === 0) return;

    const districtName = getDistrictName(feature?.properties || {});
    const stats = geoStats.find(gs => gs.name.toLowerCase() === districtName.toLowerCase()) || {};
    layer.on({
      mouseover: (e) => {

        const content = buildHoverTooltip(districtName, stats);
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
          setViewLevel('district');
          if (!pincodesData) return;
          onUpdateFilterViaMapContext({ district: districtName });
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
          setGeoData(fc);
          setViewMode('pincodes');
          setDistrictPanel((prev) => ({ ...prev, selectedDistrictName: districtName }));
          const pincodeList = filtered.map((pf) => String(pf.properties?.Pincode || ''));
          const pincodeNames = filtered.map((pf) => String(pf.properties?.Office_Name || ''));
          setPincodePanel({ districtName, pincodes: pincodeList, pincodeNames: pincodeNames, data: [] });
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
    if (!geoStats || !Array.isArray(geoStats) || geoStats.length === 0) return;

    const pin = String(feature?.properties?.Pincode || '').trim();
    const stats = geoStats.find(gs => gs.name === pin) || {};
    layer.on({
      mouseover: (e) => {
        const content = buildHoverTooltip(pin + " " + (feature.properties?.Office_Name || ''), stats);
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
      }
    });
  };

  const resetToCountry = () => {
    if (statesData) {
      setGeoData(statesData);
      setViewLevel('country');
      filters.state = null;
      filters.district = null;
      setSelectedStateName(null);
      setViewMode('analytics');
      setDistrictPanel({ stateName: null, districtNames: [], selectedDistrictName: null });
      // setPincodesInDistrict(null);
      setPincodePanel({ districtName: null, pincodes: [], pincodeNames: [], data: [] });
      const map = mapRef.current;
      if (map) {
        try {
          map.flyTo([22.9734, 78.6569], 4, { duration: 0.8, animate: true });
        } catch (e) {
          map.setView([22.9734, 78.6569], 4);
        }
        setTimeout(() => {
          try { map.invalidateSize(); } catch { }
        }, 120);
      }
    }
  };



  const buildHoverTooltip = (title, stats = {}) => {
    const { total_pensioners = '-', dlc_done = '-', dlc_pending = '-', conversion_potential = '-' } = stats;
    return `
    <div class="state-hover-card">
      <div class="state-card-title">${title}</div>
      <div class="state-card-total-pensioner">Total: ${total_pensioners}</div>
      <div class="state-card-lc-done-pensioner">LC done: ${dlc_done}</div>
      <div class="state-card-pending-pensioner">Pending: ${dlc_pending}</div>
      <div class="state-card-pending-last-manual-pensioner">Conversion potential: ${conversion_potential}</div>
    </div>
  `;
  };

  const interpolateBlue = (t) => {
    t = Math.max(0, Math.min(1, t)); // clamp between 0 and 1
    const h = 210;                  // hue (blue)
    const s = 70 + 15 * t;          // saturation: 70–85%
    const l = 95 - 35 * t;          // lightness: 95–60%
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  // Define 5 fixed shades of blue (light → dark)
  const BLUE_SHADES = [
    '#E3F2FD', // very light
    '#90CAF9', // light
    '#42A5F5', // medium
    '#1E88E5', // dark
    '#0D47A1'  // very dark
  ];

  const getColorForPensioners = (count, min, max) => {
    if (count == null || isNaN(count)) return '#f0f0f0';
    const range = max - min || 1;
    const normalized = Math.max(0, Math.min(1, (count - min) / range));
    // return interpolateBlue(normalized);

    const index = Math.min(4, Math.floor(normalized * 5));
    return BLUE_SHADES[index];
  };

  // --- Decide which field to use for coloring based on filters.data_status ---
  const getColorByField = (filters) => {
    const val = filters?.data_status?.toLowerCase?.() || '';
    const coloring_field_key = val === 'all pensioners' ? 'total_pensioners'
      : val === 'dlc completed' ? 'dlc_done'
        : val === 'dlc pending' ? 'dlc_pending'
          : val === 'plc to dlc conversion potential' ? 'conversion_potential'
            : 'total_pensioners';
    return coloring_field_key;
  }

  const colorByFieldKey = getColorByField(filters);
  const pensionerValues = geoStats?.map(g => g[colorByFieldKey] || 0) || [];
  const sortedValues = [...pensionerValues].sort((a, b) => a - b);
  const lowest = sortedValues[0] || 0;
  const highest = sortedValues[sortedValues.length - 1] || 0;

  // Build dynamic legend scale (same for all views)
  const range = highest - lowest;
  const max_legendSteps = 5;
  let dynamicLegend = [];

  if (range <= 0) {
    // completely flat data (all same value)
    dynamicLegend = [{
      label: `${Math.round(lowest).toLocaleString()}`,
      color: getColorForPensioners(lowest, lowest, highest),
    }];
  } else {
    const range_bins = [];
    const lowest = sortedValues[0] || 0;
    const highest = sortedValues[sortedValues.length - 1] || 0;
    const range = highest - lowest;
    for (let i = 0; i < max_legendSteps; i++) {
      range_bins.push({ min: Math.floor(lowest + (range / 5) * i), max: Math.ceil(lowest + (range / 5) * (i + 1)) });
    }

    dynamicLegend = range_bins.map(({ min, max }) => ({
      label: min === max ? `${min}` : `${min.toLocaleString()} – ${max.toLocaleString()}`,
      color: getColorForPensioners((min + max) / 2, lowest, highest),
    })).reverse();
    console.log('[Map] dynamicLegend:', dynamicLegend);
  }
  // darker at top



  // --- Unified map coloring helper ---
  const getFeatureStyle = (feature, geoStats, filters, lowest, highest) => {
    const metricField = getColorByField(filters);

    // Decide the feature name key depending on layer type
    const props = feature?.properties || {};
    let name = '';
    if (props.Pincode) {
      name = String(props.Pincode).trim();
    } else if (props.DISTNAME || props.DISTRICT || props.DIST_NAME) {
      name = getDistrictName(props);
    } else {
      name = getStateName(feature);
    }

    const stats = geoStats?.find((gs) => gs.name === name);
    const count = stats?.[metricField] || 0;

    return {
      color: '#455a64',
      weight: 1,
      fillColor: getColorForPensioners(count, lowest, highest),
      fillOpacity: 0.95,
    };
  };

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
              Loading...
            </Box>
          )}
          {(viewLevel === 'state' || viewLevel === 'district') && (
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
              › {filters.stateName || selectedStateName}
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

        {(geoDataLoading || geoStatsLoading) && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(32, 28, 28, 0.85)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: '#f6f3f1ff' }}>
              Loading map data...
            </Typography>
          </Box>
        )}


        {((viewLevel === 'country' && statesData) ||
          (viewLevel === 'state' && districtsData) ||
          (viewLevel === 'district' && isPincodeDataLoaded)) ? (
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
            {geoData && geoStats && geoStats.length > 0 && viewMode !== 'pincodes' && (
              <GeoJSON
                key={`${viewLevel}-${selectedStateName || 'country'}-${colorByFieldKey}-${JSON.stringify(geoStats.map(s => s.name.slice(0, 3)))}`}
                data={geoData}
                style={(feature) => getFeatureStyle(feature, geoStats, filters, lowest, highest)}
                onEachFeature={viewLevel === 'state' ? onEachDistrictFeature : onEachStateFeature}
              />
            )}
            {/* Pincode overlay when a district is selected */}
            {/*${geoStatsLoading}-- down below, this is a hack to stop the problem of geoStats and geoData being
            asynchronously loading, and the api data not being bound for the tooltips on the layer.*/}
            {viewMode === 'pincodes' && geoData && geoStats && geoStats.length > 0 && (
              <GeoJSON
                key={`${viewMode}-${districtPanel.selectedDistrictName || 'none'}-${colorByFieldKey}-${geoStatsLoading}-${JSON.stringify(geoStats.map(s => s.name.slice(0, 3)))}`}
                data={geoData}
                style={(feature) => getFeatureStyle(feature, geoStats, filters, lowest, highest)}
                onEachFeature={onEachPincodeFeature} // ✅ same tooltip/hover logic
              />
            )}

            <ZoomControl position="topright" />
          </MapContainer>
        ) : (
          <Box sx={{ textAlign: 'center', marginTop: '100px', color: '#666' }}>
            Loading map files…
          </Box>
        )}

        {viewLevel && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {dynamicLegend.map((item) => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
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
          </Box>
        )}

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
            minWidth: '160px',
          }}
        >
          {/* Legend Title */}
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 600,
              display: 'block',
              marginBottom: '4px',
              fontSize: '12px',
            }}
          >
            {(() => {
              const type = colorByFieldKey;
              if (type === 'dlc_done') return 'DLC Done';
              if (type === 'dlc_pending') return 'DLC Pending';
              if (type === 'conversion_potential') return 'PLC to DLC Conversion Potential';
              return 'Total Pensioners';
            })()}
          </Typography>

          {/* Legend Color Steps */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {dynamicLegend.map((item) => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    backgroundColor: item.color,
                    marginRight: '6px',
                    borderRadius: '3px',
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontSize: '11px', color: theme.palette.text.primary }}
                >
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Numeric Range Info */}
          <Typography
            sx={{
              fontSize: '10px',
              opacity: 0.6,
              marginTop: '4px',
              color: theme.palette.text.secondary,
            }}
          >
            Range: {Math.round(lowest).toLocaleString()} –{' '}
            {Math.round(highest).toLocaleString()}
          </Typography>
        </Box>


        {/* Districts panel moved to RightColumn; nothing renders inside the map container now. */}
      </Box>
    </Paper>
  );
};

export default MapAnalysis; 