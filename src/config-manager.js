export class ConfigManager {
  constructor() {
    this.defaultConfig = {
      enabled: true,
      aiModelsEnabled: true,
      trustScoresEnabled: true,
      riskThreshold: 70, // Percentage
      showNotifications: true,
      autoBlock: false,
      cacheExpiry: 60, // Minutes
      
      // AI Models configuration
      models: {
        vrbancic: true,
        kaggle: true,
        mendeley: true,
        huggingface: true,
        ieee: true,
        phishofe: true,
        zenodo: true
      },
      
      // Trust Score services configuration
      trustSources: {
        googleSafeBrowsing: true,
        virusTotal: true,
        urlVoid: false,
        phishTank: false
      },
      
      // Logging configuration
      logging: {
        enabled: false,
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        maxLogEntries: 1000
      },
      
      // UI configuration
      ui: {
        showDetailedResults: true,
        showConfidenceScores: true,
        darkMode: false,
        compactView: false
      },
      
      // Performance configuration
      performance: {
        maxConcurrentChecks: 3,
        timeoutMs: 10000,
        retryAttempts: 2
      }
    };
  }

  async getConfig() {
    try {
      const stored = await chrome.storage.sync.get('legitly_config');
      return { ...this.defaultConfig, ...stored.legitly_config };
    } catch (error) {
      console.error('Error getting config:', error);
      return this.defaultConfig;
    }
  }

  async updateConfig(newConfig) {
    try {
      const currentConfig = await this.getConfig();
      const updatedConfig = { ...currentConfig, ...newConfig };
      
      await chrome.storage.sync.set({
        legitly_config: updatedConfig
      });
      
      return updatedConfig;
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  }

  async initializeDefaults() {
    try {
      const existingConfig = await chrome.storage.sync.get('legitly_config');

      if (!existingConfig.legitly_config) {
        await chrome.storage.sync.set({
          legitly_config: this.defaultConfig
        });
        console.log('Initialized default configuration');
      }
    } catch (error) {
      console.error('Error initializing defaults:', error);
    }
  }

  async resetToDefaults() {
    try {
      await chrome.storage.sync.set({
        legitly_config: this.defaultConfig
      });
      return this.defaultConfig;
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      throw error;
    }
  }

  async exportConfig() {
    try {
      const config = await this.getConfig();
      const exportData = {
        version: '1.0.0',
        timestamp: Date.now(),
        config: config
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting config:', error);
      throw error;
    }
  }

  async importConfig(configJson) {
    try {
      const importData = JSON.parse(configJson);
      
      if (!importData.config) {
        throw new Error('Invalid configuration format');
      }
      
      // Validate configuration structure
      const validatedConfig = this.validateConfig(importData.config);
      
      await chrome.storage.sync.set({
        legitly_config: validatedConfig
      });
      
      return validatedConfig;
    } catch (error) {
      console.error('Error importing config:', error);
      throw error;
    }
  }

  validateConfig(config) {
    // Ensure all required fields exist and have valid types
    const validated = { ...this.defaultConfig };
    
    // Merge and validate each section
    if (config.enabled !== undefined) validated.enabled = Boolean(config.enabled);
    if (config.aiModelsEnabled !== undefined) validated.aiModelsEnabled = Boolean(config.aiModelsEnabled);
    if (config.trustScoresEnabled !== undefined) validated.trustScoresEnabled = Boolean(config.trustScoresEnabled);
    if (config.riskThreshold !== undefined) {
      validated.riskThreshold = Math.max(0, Math.min(100, Number(config.riskThreshold) || 70));
    }
    if (config.showNotifications !== undefined) validated.showNotifications = Boolean(config.showNotifications);
    if (config.autoBlock !== undefined) validated.autoBlock = Boolean(config.autoBlock);
    if (config.cacheExpiry !== undefined) {
      validated.cacheExpiry = Math.max(1, Number(config.cacheExpiry) || 60);
    }
    
    // Validate models configuration
    if (config.models && typeof config.models === 'object') {
      Object.keys(validated.models).forEach(key => {
        if (config.models[key] !== undefined) {
          validated.models[key] = Boolean(config.models[key]);
        }
      });
    }
    
    // Validate trust sources configuration
    if (config.trustSources && typeof config.trustSources === 'object') {
      Object.keys(validated.trustSources).forEach(key => {
        if (config.trustSources[key] !== undefined) {
          validated.trustSources[key] = Boolean(config.trustSources[key]);
        }
      });
    }
    
    // Validate other sections similarly
    if (config.logging && typeof config.logging === 'object') {
      validated.logging = { ...validated.logging, ...config.logging };
    }
    
    if (config.ui && typeof config.ui === 'object') {
      validated.ui = { ...validated.ui, ...config.ui };
    }
    
    if (config.performance && typeof config.performance === 'object') {
      validated.performance = { ...validated.performance, ...config.performance };
    }
    
    return validated;
  }
}
