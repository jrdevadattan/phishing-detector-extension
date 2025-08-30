// Options page functionality
document.addEventListener('DOMContentLoaded', async () => {
  await initializeOptionsPage();
  setupEventListeners();
  await loadCurrentSettings();
});

// Initialize options page
async function initializeOptionsPage() {
  console.log('Initializing options page');
  
  // Set up tab navigation
  setupTabNavigation();
  
  // Load API status
  await updateAPIStatus();
}

// Setup event listeners
function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  
  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  
  // Action buttons
  document.getElementById('clearCacheBtn').addEventListener('click', clearCache);
  document.getElementById('exportConfigBtn').addEventListener('click', exportConfig);
  document.getElementById('importConfigBtn').addEventListener('click', () => {
    document.getElementById('importConfigFile').click();
  });
  document.getElementById('importConfigFile').addEventListener('change', importConfig);
  document.getElementById('resetBtn').addEventListener('click', resetToDefaults);
  
  // Password visibility toggles
  document.querySelectorAll('.toggle-visibility').forEach(btn => {
    btn.addEventListener('click', () => togglePasswordVisibility(btn.dataset.target));
  });
  
  // Auto-save on certain changes
  const autoSaveElements = ['#enabled', '#aiModelsEnabled', '#trustScoresEnabled'];
  autoSaveElements.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener('change', debounce(saveSettings, 500));
    }
  });
}

// Setup tab navigation
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');
  
  // Show first tab by default
  if (tabs.length > 0 && contents.length > 0) {
    switchTab('general');
  }
}

// Switch between tabs
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    }
  });
  
  // Update content sections
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
    if (content.id === tabName) {
      content.classList.add('active');
    }
  });
}

// Load current settings into UI
async function loadCurrentSettings() {
  try {
    const result = await chrome.storage.sync.get('phishing_detector_config');
    const config = result.phishing_detector_config || {};
    
    // General settings
    setCheckboxValue('enabled', config.enabled);
    setCheckboxValue('showNotifications', config.showNotifications);
    setCheckboxValue('autoBlock', config.autoBlock);
    setInputValue('riskThreshold', config.riskThreshold);
    setInputValue('cacheExpiry', config.cacheExpiry);
    
    // AI Models
    setCheckboxValue('aiModelsEnabled', config.aiModelsEnabled);
    if (config.models) {
      Object.keys(config.models).forEach(model => {
        setCheckboxValue(`model-${model}`, config.models[model]);
        setCheckboxValue(`model-${model}-tab`, config.models[model]);
      });
    }
    
    // Trust Scores
    setCheckboxValue('trustScoresEnabled', config.trustScoresEnabled);
    setCheckboxValue('trustScoresEnabledTab', config.trustScoresEnabled);
    if (config.trustSources) {
      Object.keys(config.trustSources).forEach(source => {
        setCheckboxValue(`trust-${source}`, config.trustSources[source]);
        setCheckboxValue(`trust-${source}-tab`, config.trustSources[source]);
      });
    }
    
    // Advanced settings
    if (config.ui) {
      setCheckboxValue('showDetailedResults', config.ui.showDetailedResults);
      setCheckboxValue('showConfidenceScores', config.ui.showConfidenceScores);
      setCheckboxValue('darkMode', config.ui.darkMode);
    }
    
    if (config.logging) {
      setCheckboxValue('loggingEnabled', config.logging.enabled);
      setSelectValue('logLevel', config.logging.logLevel);
    }
    
    if (config.performance) {
      setInputValue('maxConcurrentChecks', config.performance.maxConcurrentChecks);
      setInputValue('timeoutMs', config.performance.timeoutMs / 1000); // Convert to seconds
    }
    
    // Load API keys
    await loadAPIKeys();
    
  } catch (error) {
    console.error('Error loading settings:', error);
    showNotification('Error loading settings', 'error');
  }
}

// Load API keys from storage
async function loadAPIKeys() {
  try {
    const result = await chrome.storage.local.get([
      'googleSafeBrowsingKey',
      'virusTotalKey'
    ]);
    
    if (result.googleSafeBrowsingKey) {
      document.getElementById('googleSafeBrowsingKey').value = result.googleSafeBrowsingKey;
      document.getElementById('googleSafeBrowsingKeyTab').value = result.googleSafeBrowsingKey;
    }
    
    if (result.virusTotalKey) {
      document.getElementById('virusTotalKey').value = result.virusTotalKey;
      document.getElementById('virusTotalKeyTab').value = result.virusTotalKey;
    }
    
  } catch (error) {
    console.error('Error loading API keys:', error);
  }
}

// Save all settings
async function saveSettings() {
  try {
    // Collect general settings
    const config = {
      enabled: getCheckboxValue('enabled'),
      aiModelsEnabled: getCheckboxValue('aiModelsEnabled') || getCheckboxValue('aiModelsEnabledTab'),
      trustScoresEnabled: getCheckboxValue('trustScoresEnabled') || getCheckboxValue('trustScoresEnabledTab'),
      riskThreshold: getInputValue('riskThreshold', 70),
      showNotifications: getCheckboxValue('showNotifications'),
      autoBlock: getCheckboxValue('autoBlock'),
      cacheExpiry: getInputValue('cacheExpiry', 60),
      
      // AI Models
      models: {
        vrbancic: getCheckboxValue('model-vrbancic') || getCheckboxValue('model-vrbancic-tab'),
        kaggle: getCheckboxValue('model-kaggle') || getCheckboxValue('model-kaggle-tab'),
        mendeley: getCheckboxValue('model-mendeley') || getCheckboxValue('model-mendeley-tab'),
        huggingface: getCheckboxValue('model-huggingface') || getCheckboxValue('model-huggingface-tab'),
        ieee: getCheckboxValue('model-ieee') || getCheckboxValue('model-ieee-tab'),
        phishofe: getCheckboxValue('model-phishofe') || getCheckboxValue('model-phishofe-tab'),
        zenodo: getCheckboxValue('model-zenodo') || getCheckboxValue('model-zenodo-tab')
      },
      
      // Trust Sources
      trustSources: {
        googleSafeBrowsing: getCheckboxValue('trust-googleSafeBrowsing') || getCheckboxValue('trust-googleSafeBrowsing-tab'),
        virusTotal: getCheckboxValue('trust-virusTotal') || getCheckboxValue('trust-virusTotal-tab'),
        urlVoid: getCheckboxValue('trust-urlVoid'),
        phishTank: getCheckboxValue('trust-phishTank')
      },
      
      // UI settings
      ui: {
        showDetailedResults: getCheckboxValue('showDetailedResults'),
        showConfidenceScores: getCheckboxValue('showConfidenceScores'),
        darkMode: getCheckboxValue('darkMode'),
        compactView: false
      },
      
      // Logging settings
      logging: {
        enabled: getCheckboxValue('loggingEnabled'),
        logLevel: getSelectValue('logLevel', 'info'),
        maxLogEntries: 1000
      },
      
      // Performance settings
      performance: {
        maxConcurrentChecks: getInputValue('maxConcurrentChecks', 3),
        timeoutMs: getInputValue('timeoutMs', 10) * 1000, // Convert to milliseconds
        retryAttempts: 2
      }
    };
    
    // Save main config
    await chrome.storage.sync.set({
      phishing_detector_config: config
    });
    
    // Save API keys separately
    const apiKeys = {};
    const googleKey = getInputValue('googleSafeBrowsingKey') || getInputValue('googleSafeBrowsingKeyTab');
    const virusKey = getInputValue('virusTotalKey') || getInputValue('virusTotalKeyTab');
    
    if (googleKey) apiKeys.googleSafeBrowsingKey = googleKey;
    if (virusKey) apiKeys.virusTotalKey = virusKey;
    
    if (Object.keys(apiKeys).length > 0) {
      await chrome.storage.local.set(apiKeys);
    }
    
    // Notify background script of config update
    chrome.runtime.sendMessage({
      action: 'updateConfig',
      config: config
    });
    
    showNotification('Settings saved successfully!');
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showNotification('Failed to save settings', 'error');
  }
}

// Utility functions for form handling
function getCheckboxValue(id) {
  const element = document.getElementById(id);
  return element ? element.checked : false;
}

function setCheckboxValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.checked = Boolean(value);
}

function getInputValue(id, defaultValue = '') {
  const element = document.getElementById(id);
  return element ? element.value || defaultValue : defaultValue;
}

function setInputValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value || '';
}

function getSelectValue(id, defaultValue = '') {
  const element = document.getElementById(id);
  return element ? element.value || defaultValue : defaultValue;
}

function setSelectValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value || '';
}

// Toggle password visibility
function togglePasswordVisibility(targetId) {
  const input = document.getElementById(targetId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

// Action button handlers
async function clearCache() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'clearCache' });
    if (response && response.success) {
      showNotification('Cache cleared successfully!');
    } else {
      showNotification('Failed to clear cache', 'error');
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    showNotification('Failed to clear cache', 'error');
  }
}

async function exportConfig() {
  try {
    const result = await chrome.storage.sync.get('phishing_detector_config');
    const config = result.phishing_detector_config || {};
    
    const exportData = {
      version: '1.0.0',
      timestamp: Date.now(),
      config: config
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `phishing-detector-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('Configuration exported successfully!');
    
  } catch (error) {
    console.error('Error exporting config:', error);
    showNotification('Failed to export configuration', 'error');
  }
}

async function importConfig(event) {
  try {
    const file = event.target.files[0];
    if (!file) return;
    
    const text = await file.text();
    const importData = JSON.parse(text);
    
    if (!importData.config) {
      throw new Error('Invalid configuration file format');
    }
    
    await chrome.storage.sync.set({
      phishing_detector_config: importData.config
    });
    
    await loadCurrentSettings();
    showNotification('Configuration imported successfully!');
    
  } catch (error) {
    console.error('Error importing config:', error);
    showNotification('Failed to import configuration', 'error');
  }
}

async function resetToDefaults() {
  if (!confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
    return;
  }
  
  try {
    // Clear existing config
    await chrome.storage.sync.remove('phishing_detector_config');
    await chrome.storage.local.remove(['googleSafeBrowsingKey', 'virusTotalKey']);
    
    // Reload page to show defaults
    window.location.reload();
    
  } catch (error) {
    console.error('Error resetting to defaults:', error);
    showNotification('Failed to reset settings', 'error');
  }
}

// Update API status display
async function updateAPIStatus() {
  try {
    const result = await chrome.storage.local.get([
      'googleSafeBrowsingKey',
      'virusTotalKey'
    ]);
    
    const statusList = document.getElementById('apiStatusList');
    if (!statusList) return;
    
    statusList.innerHTML = '';
    
    // Google Safe Browsing status
    const googleStatus = document.createElement('div');
    googleStatus.className = 'api-status-item';
    googleStatus.innerHTML = `
      <span>Google Safe Browsing:</span>
      <span class="status ${result.googleSafeBrowsingKey ? 'configured' : 'not-configured'}">
        ${result.googleSafeBrowsingKey ? '✓ Configured' : '✗ Not Configured'}
      </span>
    `;
    statusList.appendChild(googleStatus);
    
    // VirusTotal status
    const virusTotalStatus = document.createElement('div');
    virusTotalStatus.className = 'api-status-item';
    virusTotalStatus.innerHTML = `
      <span>VirusTotal:</span>
      <span class="status ${result.virusTotalKey ? 'configured' : 'not-configured'}">
        ${result.virusTotalKey ? '✓ Configured' : '✗ Not Configured'}
      </span>
    `;
    statusList.appendChild(virusTotalStatus);
    
  } catch (error) {
    console.error('Error updating API status:', error);
  }
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.getElementById('saveNotification');
  const span = notification.querySelector('span');
  
  span.textContent = type === 'success' ? `✓ ${message}` : `✗ ${message}`;
  notification.style.background = type === 'success' ? '#4caf50' : '#f44336';
  
  notification.classList.remove('hidden');
  
  setTimeout(() => {
    notification.classList.add('hidden');
  }, 3000);
}

// Debounce function for auto-save
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
