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
  console.log('Legitly installed');
  
  try {
    // Initialize managers in correct order
    configManager = new ConfigManager();
    await configManager.initializeDefaults();
    
    cacheManager = new CacheManager();
    trustScoreManager = new TrustScoreManager();
    ensembleEngine = new EnsembleDecisionEngine();
    
    // Initialize AI models last since they depend on config
    aiModelManager = new AIModelManager();
    await aiModelManager.loadModels();
    
  } catch (error) {
    console.error('Initialization error:', error);
  }
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
    if (!url || !tabId) {
      console.warn('Invalid URL or tabId');
      return;
    }

    // Get configuration
    const config = await configManager.getConfig();
    
    if (!config || !config.enabled) {
      console.log('Extension disabled or config not loaded');
      return;
    }
    
    // Initialize managers if they're not ready
    if (!ensembleEngine || !aiModelManager || !trustScoreManager || !cacheManager) {
      console.warn('Managers not initialized, reinitializing...');
      ensembleEngine = new EnsembleDecisionEngine();
      aiModelManager = aiModelManager || new AIModelManager();
      trustScoreManager = trustScoreManager || new TrustScoreManager();
      cacheManager = cacheManager || new CacheManager();
      await aiModelManager.loadModels();
    }
    
    // Check cache first
    let result;
    const cachedResult = await cacheManager.get(url);
    if (cachedResult && !isExpired(cachedResult.timestamp, config.cacheExpiry)) {
      result = cachedResult.result;
      console.log('Using cached result for:', url);
    } else {
      // Perform new analysis
      result = await performPhishingAnalysis(url, config);
      if (result && result.ensemble) {
        await cacheManager.set(url, result);
      }
    }
    
    // Handle result
    if (result && result.ensemble) {
      await handleResult(result, url, tabId);
    } else {
      console.error('Invalid analysis result for:', url);
      // Set a neutral result if analysis fails
      const neutralResult = {
        ensemble: {
          riskPercentage: 50,
          confidence: 0.1,
          recommendation: 'SUSPICIOUS'
        }
      };
      await handleResult(neutralResult, url, tabId);
    }
    
  } catch (error) {
    console.error('Error analyzing URL:', error);
    // Set badge to indicate error
    await updateBadge(50, tabId);
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
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    title: 'Legitly Warning',
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
      if (!request || !request.action) {
        throw new Error('Invalid request');
      }

      switch (request.action) {
        case 'getResult':
          if (!request.tabId) {
            throw new Error('Missing tabId');
          }
          const result = await chrome.storage.local.get(`result_${request.tabId}`);
          const storedResult = result[`result_${request.tabId}`];
          
          if (!storedResult) {
            // If no result found, trigger new analysis
            if (sender.tab && sender.tab.url) {
              await analyzeURL(sender.tab.url, request.tabId);
              const newResult = await chrome.storage.local.get(`result_${request.tabId}`);
              sendResponse(newResult[`result_${request.tabId}`] || null);
            } else {
              sendResponse(null);
            }
          } else {
            sendResponse(storedResult);
          }
          break;
          
        case 'forceAnalysis':
          if (!request.url || !request.tabId) {
            throw new Error('Missing url or tabId');
          }
          await analyzeURL(request.url, request.tabId);
          // Get and send the fresh result
          const freshResult = await chrome.storage.local.get(`result_${request.tabId}`);
          sendResponse({
            success: true,
            result: freshResult[`result_${request.tabId}`]
          });
          break;
          
        case 'updateConfig':
          if (!request.config) {
            throw new Error('Missing config');
          }
          await configManager.updateConfig(request.config);
          // Clear cache when config changes
          await cacheManager.clear();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({ 
        error: error.message,
        success: false
      });
    }
  })();
  
  return true; // Keep message channel open for async response
});
