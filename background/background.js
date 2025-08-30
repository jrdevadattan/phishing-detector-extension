// Load required scripts
importScripts('../src/ai-models.js', '../src/trust-scores.js', '../src/ensemble-engine.js', '../src/cache-manager.js', '../src/config-manager.js');

// Initialize managers
let aiModelManager;
let trustScoreManager;
let ensembleEngine;
let cacheManager;
let configManager;

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Phishing Detector Pro installed');
  
  // Initialize managers
  configManager = new ConfigManager();
  cacheManager = new CacheManager();
  aiModelManager = new AIModelManager();
  trustScoreManager = new TrustScoreManager();
  ensembleEngine = new EnsembleDecisionEngine();
  
  // Load AI models
  await aiModelManager.loadModels();
  
  // Set default settings
  await configManager.initializeDefaults();
});

// Listen for navigation events
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0) { // Main frame only
    await analyzeURL(details.url, details.tabId);
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.url) {
    await analyzeURL(tab.url, tabId);
  }
});

// Main URL analysis function
async function analyzeURL(url, tabId) {
  try {
    // Get configuration
    const config = await configManager.getConfig();
    
    if (!config.enabled) return;
    
    // Check cache first
    const cachedResult = await cacheManager.get(url);
    if (cachedResult && !isExpired(cachedResult.timestamp, config.cacheExpiry)) {
      await handleResult(cachedResult.result, url, tabId);
      return;
    }
    
    // Perform analysis
    const result = await performPhishingAnalysis(url, config);
    
    // Cache result
    await cacheManager.set(url, result);
    
    // Handle result
    await handleResult(result, url, tabId);
    
  } catch (error) {
    console.error('Error analyzing URL:', error);
  }
}

// Perform comprehensive phishing analysis
async function performPhishingAnalysis(url, config) {
  const results = {
    url,
    timestamp: Date.now(),
    aiModels: {},
    trustScores: {},
    ensemble: null
  };
  
  // Run AI models if enabled
  if (config.aiModelsEnabled) {
    const modelPromises = [];
    
    if (config.models.vrbancic) {
      modelPromises.push(
        aiModelManager.predictVrbancic(url).then(result => 
          results.aiModels.vrbancic = result
        )
      );
    }
    
    if (config.models.kaggle) {
      modelPromises.push(
        aiModelManager.predictKaggle(url).then(result => 
          results.aiModels.kaggle = result
        )
      );
    }
    
    if (config.models.mendeley) {
      modelPromises.push(
        aiModelManager.predictMendeley(url).then(result => 
          results.aiModels.mendeley = result
        )
      );
    }
    
    if (config.models.huggingface) {
      modelPromises.push(
        aiModelManager.predictHuggingFace(url).then(result => 
          results.aiModels.huggingface = result
        )
      );
    }
    
    if (config.models.ieee) {
      modelPromises.push(
        aiModelManager.predictIEEE(url).then(result => 
          results.aiModels.ieee = result
        )
      );
    }
    
    if (config.models.phishofe) {
      modelPromises.push(
        aiModelManager.predictPhishOFE(url).then(result => 
          results.aiModels.phishofe = result
        )
      );
    }
    
    if (config.models.zenodo) {
      modelPromises.push(
        aiModelManager.predictZenodo(url).then(result => 
          results.aiModels.zenodo = result
        )
      );
    }
    
    await Promise.allSettled(modelPromises);
  }
  
  // Get trust scores if enabled
  if (config.trustScoresEnabled) {
    const trustPromises = [];
    
    if (config.trustSources.googleSafeBrowsing) {
      trustPromises.push(
        trustScoreManager.getGoogleSafeBrowsing(url).then(result => 
          results.trustScores.googleSafeBrowsing = result
        )
      );
    }
    
    if (config.trustSources.virusTotal) {
      trustPromises.push(
        trustScoreManager.getVirusTotal(url).then(result => 
          results.trustScores.virusTotal = result
        )
      );
    }
    
    await Promise.allSettled(trustPromises);
  }
  
  // Generate ensemble decision
  results.ensemble = ensembleEngine.generateDecision(results.aiModels, results.trustScores, config);
  
  return results;
}

// Handle analysis results
async function handleResult(result, url, tabId) {
  const config = await configManager.getConfig();
  const risk = result.ensemble.riskPercentage;
  
  // Update badge
  await updateBadge(risk, tabId);
  
  // Check if warning is needed
  if (risk >= config.riskThreshold) {
    if (config.autoBlock) {
      await blockPage(tabId, result);
    } else if (config.showNotifications) {
      await showWarningNotification(url, result);
    }
  }
  
  // Store result for popup access
  await chrome.storage.local.set({
    [`result_${tabId}`]: result
  });
}

// Update extension badge
async function updateBadge(riskPercentage, tabId) {
  let color, text;
  
  if (riskPercentage >= 80) {
    color = '#FF0000'; // Red
    text = 'HIGH';
  } else if (riskPercentage >= 50) {
    color = '#FF8C00'; // Orange
    text = 'MED';
  } else if (riskPercentage >= 20) {
    color = '#FFD700'; // Yellow
    text = 'LOW';
  } else {
    color = '#00AA00'; // Green
    text = 'SAFE';
  }
  
  await chrome.action.setBadgeText({ text, tabId });
  await chrome.action.setBadgeBackgroundColor({ color, tabId });
}

// Show warning notification
async function showWarningNotification(url, result) {
  const domain = new URL(url).hostname;
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Phishing Warning',
    message: `Suspicious website detected: ${domain}\nRisk: ${result.ensemble.riskPercentage}%`
  });
}

// Block page (redirect to warning page)
async function blockPage(tabId, result) {
  const warningUrl = chrome.runtime.getURL('assets/warning.html') + 
    '?url=' + encodeURIComponent(result.url) + 
    '&risk=' + result.ensemble.riskPercentage;
  
  chrome.tabs.update(tabId, { url: warningUrl });
}

// Check if cached result is expired
function isExpired(timestamp, expiryMinutes) {
  const now = Date.now();
  const expiry = expiryMinutes * 60 * 1000; // Convert to milliseconds
  return (now - timestamp) > expiry;
}

// Message handler for popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'getResult':
          const result = await chrome.storage.local.get(`result_${request.tabId}`);
          sendResponse(result[`result_${request.tabId}`] || null);
          break;
          
        case 'forceAnalysis':
          await analyzeURL(request.url, request.tabId);
          sendResponse({ success: true });
          break;
          
        case 'updateConfig':
          await configManager.updateConfig(request.config);
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ error: error.message });
    }
  })();
  
  return true; // Keep message channel open for async response
});
