export class CacheManager {
  constructor() {
    this.cachePrefix = 'phishing_cache_';
    this.maxCacheSize = 1000; // Maximum number of cached results
    this.defaultExpiry = 60; // Default expiry in minutes
  }

  async get(url) {
    try {
      const cacheKey = this.getCacheKey(url);
      const result = await chrome.storage.local.get(cacheKey);
      return result[cacheKey] || null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(url, result) {
    try {
      const cacheKey = this.getCacheKey(url);
      const cacheData = {
        result: result,
        timestamp: Date.now(),
        url: url
      };

      // Store in cache
      await chrome.storage.local.set({
        [cacheKey]: cacheData
      });

      // Maintain cache size
      await this.maintainCacheSize();
      
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async clear() {
    try {
      const allData = await chrome.storage.local.get();
      const cacheKeys = Object.keys(allData).filter(key => 
        key.startsWith(this.cachePrefix)
      );
      
      if (cacheKeys.length > 0) {
        await chrome.storage.local.remove(cacheKeys);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async clearExpired(expiryMinutes = this.defaultExpiry) {
    try {
      const allData = await chrome.storage.local.get();
      const now = Date.now();
      const expiry = expiryMinutes * 60 * 1000;
      
      const expiredKeys = Object.entries(allData)
        .filter(([key, data]) => {
          if (!key.startsWith(this.cachePrefix)) return false;
          return data.timestamp && (now - data.timestamp) > expiry;
        })
        .map(([key]) => key);
      
      if (expiredKeys.length > 0) {
        await chrome.storage.local.remove(expiredKeys);
        console.log(`Cleared ${expiredKeys.length} expired cache entries`);
      }
    } catch (error) {
      console.error('Clear expired cache error:', error);
    }
  }

  async maintainCacheSize() {
    try {
      const allData = await chrome.storage.local.get();
      const cacheEntries = Object.entries(allData)
        .filter(([key]) => key.startsWith(this.cachePrefix))
        .map(([key, data]) => ({ key, timestamp: data.timestamp || 0 }))
        .sort((a, b) => a.timestamp - b.timestamp); // Oldest first

      if (cacheEntries.length > this.maxCacheSize) {
        const toRemove = cacheEntries
          .slice(0, cacheEntries.length - this.maxCacheSize)
          .map(entry => entry.key);
        
        await chrome.storage.local.remove(toRemove);
        console.log(`Removed ${toRemove.length} old cache entries`);
      }
    } catch (error) {
      console.error('Maintain cache size error:', error);
    }
  }

  async getStats() {
    try {
      const allData = await chrome.storage.local.get();
      const cacheEntries = Object.entries(allData)
        .filter(([key]) => key.startsWith(this.cachePrefix));

      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const oneDay = 24 * oneHour;

      const stats = {
        totalEntries: cacheEntries.length,
        recentEntries: cacheEntries.filter(([, data]) => 
          data.timestamp && (now - data.timestamp) < oneHour
        ).length,
        todayEntries: cacheEntries.filter(([, data]) => 
          data.timestamp && (now - data.timestamp) < oneDay
        ).length,
        oldestEntry: cacheEntries.length > 0 ? 
          Math.min(...cacheEntries.map(([, data]) => data.timestamp || now)) : null,
        newestEntry: cacheEntries.length > 0 ? 
          Math.max(...cacheEntries.map(([, data]) => data.timestamp || 0)) : null
      };

      return stats;
    } catch (error) {
      console.error('Get cache stats error:', error);
      return null;
    }
  }

  getCacheKey(url) {
    // Create a simple hash of the URL for the cache key
    return this.cachePrefix + this.simpleHash(url);
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Preload cache with common legitimate sites
  async preloadCache() {
    const commonSites = [
      'https://google.com',
      'https://github.com',
      'https://stackoverflow.com',
      'https://mozilla.org',
      'https://w3.org'
    ];

    const preloadResults = commonSites.map(url => ({
      url,
      timestamp: Date.now(),
      result: {
        url,
        timestamp: Date.now(),
        aiModels: {},
        trustScores: {},
        ensemble: {
          riskPercentage: 5,
          confidence: 0.9,
          recommendation: 'SAFE',
          details: { preloaded: true }
        }
      }
    }));

    // Store preloaded results
    const cacheData = {};
    preloadResults.forEach(item => {
      cacheData[this.getCacheKey(item.url)] = item;
    });

    await chrome.storage.local.set(cacheData);
    console.log('Preloaded cache with common legitimate sites');
  }
}
