/**
 * Cache Utility
 * Caches API responses to avoid repeated API calls
 * Uses localStorage for persistence across page reloads
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
    // Track in-flight requests to dedupe concurrent calls
    this.pending = new Map();

    // Load existing cache from localStorage on init
    this.loadFromLocalStorage();
  }

  /**
   * Load cache from localStorage
   */
  loadFromLocalStorage() {
    try {
      const cacheData = localStorage.getItem('api_cache');
      const timestampData = localStorage.getItem('api_cache_timestamps');

      if (cacheData && timestampData) {
        const cache = JSON.parse(cacheData);
        const timestamps = JSON.parse(timestampData);

        // Restore cache and timestamps
        Object.entries(cache).forEach(([key, value]) => {
          this.cache.set(key, value);
        });

        Object.entries(timestamps).forEach(([key, value]) => {
          this.timestamps.set(key, value);
        });

        console.log('💾 Cache loaded from localStorage:', this.cache.size, 'entries');

        // Clean expired entries
        this.cleanExpired();
      }
    } catch (err) {
      console.error('❌ Failed to load cache from localStorage:', err);
    }
  }

  /**
   * Save cache to localStorage
   */
  saveToLocalStorage() {
    try {
      const cacheObj = {};
      const timestampObj = {};

      this.cache.forEach((value, key) => {
        cacheObj[key] = value;
      });

      this.timestamps.forEach((value, key) => {
        timestampObj[key] = value;
      });

      localStorage.setItem('api_cache', JSON.stringify(cacheObj));
      localStorage.setItem('api_cache_timestamps', JSON.stringify(timestampObj));
    } catch (err) {
      console.error('❌ Failed to save cache to localStorage:', err);
    }
  }

  /**
   * Generate cache key from URL and params
   */
  generateKey(url, params = {}) {
    const paramString = JSON.stringify(params);
    return `${url}_${paramString}`;
  }

  /**
   * Register an in-flight request promise
   */
  setPending(key, promise) {
    this.pending.set(key, promise);
  }

  /**
   * Get a pending request promise if exists
   */
  getPending(key) {
    return this.pending.get(key) || null;
  }

  /**
   * Clear a pending request record
   */
  clearPending(key) {
    this.pending.delete(key);
  }

  /**
   * Set cache with TTL (Time To Live)
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, data);
    this.timestamps.set(key, {
      createdAt: Date.now(),
      ttl: ttl,
    });
    console.log(`💾 Cache SET: ${key} (TTL: ${ttl / 1000}s)`);

    // Save to localStorage for persistence
    this.saveToLocalStorage();
  }

  /**
   * Get cached data if valid
   * @param {string} key - Cache key
   * @returns {any|null} - Cached data or null if expired/not found
   */
  get(key) {
    if (!this.cache.has(key)) {
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }

    const timestamp = this.timestamps.get(key);
    const now = Date.now();
    const age = now - timestamp.createdAt;

    // Check if cache is expired
    if (age > timestamp.ttl) {
      console.log(`⏰ Cache EXPIRED: ${key} (age: ${age / 1000}s)`);
      this.delete(key);
      return null;
    }

    console.log(`✅ Cache HIT: ${key} (age: ${age / 1000}s)`);
    return this.cache.get(key);
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    console.log(`🗑️ Cache DELETE: ${key}`);

    // Update localStorage
    this.saveToLocalStorage();
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
    this.pending.clear();

    // Clear localStorage
    localStorage.removeItem('api_cache');
    localStorage.removeItem('api_cache_timestamps');

    console.log('🧹 Cache CLEARED');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, timestamp] of this.timestamps.entries()) {
      const age = now - timestamp.createdAt;
      if (age > timestamp.ttl) {
        this.cache.delete(key);
        this.timestamps.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
      // Update localStorage after cleaning
      this.saveToLocalStorage();
    }

    return cleaned;
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Auto-clean expired cache every 5 minutes
setInterval(() => {
  cacheManager.cleanExpired();
}, 5 * 60 * 1000);

export default cacheManager;

/**
 * Helper function to fetch with cache
 * @param {string} url - API URL
 * @param {object} params - Fetch options
 * @param {number} cacheTTL - Cache TTL in milliseconds (default: 5 minutes)
 * @returns {Promise} - API response
 */
export const fetchWithCache = async (url, params = {}, cacheTTL = 5 * 60 * 1000) => {
  console.log("Fetch with cache called for URL:", url, "with params:", params);
  const cacheKey = cacheManager.generateKey(url, params);

  // If there's an in-flight request, reuse its promise immediately
  const pending = cacheManager.getPending(cacheKey);
  if (pending) {
    return pending;
  }

  // Try to get from cache first
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData !== null) {
    return cachedData;
  }

  // If not in cache, fetch from API (and dedupe concurrent callers)
  console.log(`🌐 API Request: ${url}`);

  // Add CORS mode and credentials
  const fetchOptions = {
    // ...params,
    mode: 'cors',
    credentials: 'omit',
  };

  const requestPromise = (async () => {
    try {

      const prepared_url = url;
      const bodyData = Object.keys(params).length ? JSON.stringify(params) : null;
      const response = await fetch(prepared_url, {
        ...fetchOptions,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(fetchOptions.headers || {}),
        },
        body: bodyData,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json()
      console.log(data);

      // Store in cache
      cacheManager.set(cacheKey, data, cacheTTL);

      return data;
    } finally {
      // Ensure we clear pending regardless of success/failure
      cacheManager.clearPending(cacheKey);
    }
  })();

  // Register pending promise and return it
  cacheManager.setPending(cacheKey, requestPromise);
  return requestPromise;
};
