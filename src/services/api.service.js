import API_CONFIG, { API_ENDPOINTS } from '../config/api.config';

/**
 * API Service - Centralized API call handler
 * Handles all API requests with base URL, headers, and error handling
 */
class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.defaultHeaders = API_CONFIG.DEFAULT_HEADERS;
  }

  /**
   * Get authentication token from localStorage
   */
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * Get headers with authentication token
   */
  getHeaders(customHeaders = {}) {
    const token = this.getAuthToken();
    const headers = {
      ...this.defaultHeaders,
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Build full URL
   */
  buildURL(endpoint) {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseURL}/${cleanEndpoint}`;
  }

  /**
   * Generic API call method
   */
  async request(endpoint, options = {}) {
    const url = this.buildURL(endpoint);
    const headers = this.getHeaders(options.headers);

    const config = {
      ...options,
      headers,
    };

    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`✅ API Response: ${response.status} ${url}`);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.message || `HTTP Error: ${response.status}`,
          data: errorData,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        status: response.status,
      };
    } catch (error) {
      console.error(`❌ API Error: ${url}`, error);

      if (error.name === 'AbortError') {
        throw {
          success: false,
          message: 'Request timeout',
          error: 'TIMEOUT',
        };
      }

      throw {
        success: false,
        message: error.message || 'Network error',
        error: error,
      };
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

// Export API methods for easy use
export const api = {
  // Generic methods
  get: (endpoint, params) => apiService.get(endpoint, params),
  post: (endpoint, data) => apiService.post(endpoint, data),
  put: (endpoint, data) => apiService.put(endpoint, data),
  delete: (endpoint) => apiService.delete(endpoint),

  // Authentication APIs
  auth: {
    sendOTP: (phone) => apiService.post(API_ENDPOINTS.AUTH.SEND_OTP, { phone }),
    verifyOTP: (phone, otp) => apiService.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { phone, otp }),
    logout: () => apiService.post(API_ENDPOINTS.AUTH.LOGOUT),
  },

  // Dashboard APIs
  dashboard: {
    getStats: () => apiService.get(API_ENDPOINTS.DASHBOARD.STATS),
    getPensioners: (params) => apiService.get(API_ENDPOINTS.DASHBOARD.PENSIONERS, params),
    getDLCData: () => apiService.get(API_ENDPOINTS.DASHBOARD.DLC_DATA),
    getManualData: () => apiService.get(API_ENDPOINTS.DASHBOARD.MANUAL_DATA),
    getVerifiedToday: () => apiService.get(API_ENDPOINTS.DASHBOARD.VERIFIED_TODAY),
    getPendingQueue: () => apiService.get(API_ENDPOINTS.DASHBOARD.PENDING_QUEUE),
  },

  // Map APIs
  map: {
    getStates: () => apiService.get(API_ENDPOINTS.MAP.STATES),
    getDistricts: (stateId) => apiService.get(API_ENDPOINTS.MAP.DISTRICTS, { stateId }),
    getPincodes: (districtId) => apiService.get(API_ENDPOINTS.MAP.PINCODES, { districtId }),
  },

  // Analytics APIs
  analytics: {
    getAgeBreakdown: () => apiService.get(API_ENDPOINTS.ANALYTICS.AGE_BREAKDOWN),
    getStateAnalytics: (stateId) => apiService.get(API_ENDPOINTS.ANALYTICS.STATE_ANALYTICS, { stateId }),
    getVerificationMethods: () => apiService.get(API_ENDPOINTS.ANALYTICS.VERIFICATION_METHODS),
  },
};

export default apiService;
