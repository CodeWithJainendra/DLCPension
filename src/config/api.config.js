// API Configuration
const API_CONFIG = {
  // Base URL for production API
  BASE_URL: 'http://localhost:9007/dlc-pension-data-api',
  
  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000, // 30 seconds
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    LOGOUT: '/auth/logout',
  },
  
  // Dashboard data endpoints
  DASHBOARD: {
    STATS: '/dashboard/stats',
    PENSIONERS: '/dashboard/pensioners',
    DLC_DATA: '/dashboard/dlc-data',
    MANUAL_DATA: '/dashboard/manual-data',
    VERIFIED_TODAY: '/dashboard/verified-today',
    PENDING_QUEUE: '/dashboard/pending-queue',
  },
  
  // Map data endpoints
  MAP: {
    STATES: '/map/states',
    DISTRICTS: '/map/districts',
    PINCODES: '/map/pincodes',
  },
  
  // Analytics endpoints
  ANALYTICS: {
    AGE_BREAKDOWN: '/analytics/age-breakdown',
    STATE_ANALYTICS: '/analytics/state-analytics',
    VERIFICATION_METHODS: '/analytics/verification-methods',
  },
};

export default API_CONFIG;
