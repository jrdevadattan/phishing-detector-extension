// DOM elements
const loadingState = document.getElementById('loadingState');
const mainContent = document.getElementById('mainContent');
const errorState = document.getElementById('errorState');
const riskCircle = document.getElementById('riskCircle');
const riskPercentage = document.getElementById('riskPercentage');
const recommendation = document.getElementById('recommendation');
const confidence = document.getElementById('confidence');
const urlInfo = document.getElementById('urlInfo');
const detailedResults = document.getElementById('detailedResults');
const showDetailedToggle = document.getElementById('showDetailedToggle');
const refreshBtn = document.getElementById('refreshBtn');
const reportBtn = document.getElementById('reportBtn');
const retryBtn = document.getElementById('retryBtn');
const settingsBtn = document.getElementById('settingsBtn');
const helpBtn = document.getElementById('helpBtn');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadCurrentTabAnalysis();
    setupEventListeners();
  } catch (error) {
    showError('Failed to initialize popup', error.message);
  }
});

// Setup event listeners
function setupEventListeners() {
  showDetailedToggle.addEventListener('change', toggleDetailedView);
  refreshBtn.addEventListener('click', refreshAnalysis);
  reportBtn.addEventListener('click', reportIssue);
  retryBtn.addEventListener('click', retryAnalysis);
  settingsBtn.addEventListener('click', openSettings);
  helpBtn.addEventListener('click', showHelp);
}

// Load analysis for current tab
async function loadCurrentTabAnalysis() {
  try {
    showLoading();
    
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      showError('No active tab', 'Cannot analyze the current tab');
      return;
    }

    // Skip chrome:// and extension URLs
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showError('Cannot analyze', 'This page cannot be analyzed for security reasons');
      return;
    }

    // Get analysis result from background script
    const response = await chrome.runtime.sendMessage({
      action: 'getResult',
      tabId: tab.id
    });

    if (response && response.ensemble) {
      displayResults(response, tab.url);
    } else {
      // Force new analysis if no cached result
      await forceAnalysis(tab);
    }
    
  } catch (error) {
    showError('Analysis failed', error.message);
  }
}

// Force new analysis
async function forceAnalysis(tab) {
  try {
    // Request new analysis
    await chrome.runtime.sendMessage({
      action: 'forceAnalysis',
      url: tab.url,
      tabId: tab.id
    });

    // Wait a moment for analysis to complete
    setTimeout(async () => {
      const response = await chrome.runtime.sendMessage({
        action: 'getResult',
        tabId: tab.id
      });

      if (response && response.ensemble) {
        displayResults(response, tab.url);
      } else {
        showError('Analysis incomplete', 'Please try refreshing the analysis');
      }
    }, 3000);
    
  } catch (error) {
    showError('Force analysis failed', error.message);
  }
}

// Display analysis results
function displayResults(result, url) {
  hideLoading();
  hideError();
  
  const ensemble = result.ensemble;
  const riskPercent = ensemble.riskPercentage;
  
  // Update risk circle
  riskPercentage.textContent = riskPercent + '%';
  
  // Set risk level class
  riskCircle.className = 'risk-circle';
  if (riskPercent >= 70) {
    riskCircle.classList.add('phishing');
  } else if (riskPercent >= 30) {
    riskCircle.classList.add('suspicious');
  } else {
    riskCircle.classList.add('safe');
  }
  
  // Update recommendation
  recommendation.textContent = ensemble.recommendation;
  recommendation.className = 'recommendation ' + ensemble.recommendation.toLowerCase();
  
  // Update confidence
  const confidencePercent = Math.round(ensemble.confidence * 100);
  confidence.textContent = `Confidence: ${confidencePercent}%`;
  
  // Update URL info
  const domain = new URL(url).hostname;
  urlInfo.textContent = domain;
  
  // Update detailed results
  updateDetailedResults(result);
  
  showMainContent();
}

// Update detailed results section
function updateDetailedResults(result) {
  updateAIModelResults(result.aiModels);
  updateTrustScoreResults(result.trustScores);
  updateRiskFactors(result.ensemble.breakdown.factors);
}

// Update AI model results
function updateAIModelResults(aiModels) {
  const container = document.getElementById('aiModelResults');
  const countElement = document.getElementById('aiModelCount');
  
  const validModels = Object.entries(aiModels).filter(([key, result]) => 
    result && !result.error
  );
  
  countElement.textContent = `(${validModels.length}/7)`;
  
  container.innerHTML = '';
  
  if (validModels.length === 0) {
    container.innerHTML = '<div class="result-item"><span>No AI models available</span></div>';
    return;
  }
  
  validModels.forEach(([key, result]) => {
    const item = document.createElement('div');
    item.className = 'result-item';
    
    const scorePercent = Math.round(result.score * 100);
    const scoreClass = scorePercent >= 70 ? 'phishing' : 
                     scorePercent >= 30 ? 'suspicious' : 'safe';
    
    item.innerHTML = `
      <span class="result-name">${result.modelName}</span>
      <span class="result-score ${scoreClass}">${scorePercent}%</span>
    `;
    
    container.appendChild(item);
  });
}

// Update trust score results
function updateTrustScoreResults(trustScores) {
  const container = document.getElementById('trustScoreResults');
  const countElement = document.getElementById('trustScoreCount');
  
  if (!trustScores || typeof trustScores !== 'object') {
    countElement.textContent = '(0/3)';
    container.innerHTML = '<div class="result-item"><span>No trust scores available</span></div>';
    return;
  }
  
  const validScores = [];
  
  // Process each trust score service with proper data extraction
  Object.entries(trustScores).forEach(([key, result]) => {
    if (!result || result.error || !result.available) {
      return; // Skip unavailable services
    }
    
    let scorePercent, status, serviceName;
    
    switch (key) {
      case 'googleSafeBrowsing':
        serviceName = 'Google Safe Browsing';
        if (result.isSafe === true) {
          scorePercent = 5; // Very safe
          status = 'CLEAN';
        } else if (result.isSafe === false) {
          scorePercent = 95; // Very dangerous
          status = 'THREAT';
        } else {
          return; // Skip if no clear result
        }
        break;
        
      case 'virusTotal':
        serviceName = 'VirusTotal';
        if (result.scanning) {
          scorePercent = 50;
          status = 'SCANNING';
        } else if (result.total && result.total > 0) {
          const detectionRate = result.positives / result.total;
          scorePercent = Math.round(detectionRate * 100);
          status = scorePercent > 10 ? 'DETECTED' : 'CLEAN';
        } else {
          return; // Skip if no scan data
        }
        break;
        
      case 'domainReputation':
        serviceName = 'Domain Reputation';
        if (result.score !== undefined) {
          scorePercent = 100 - result.score; // Convert reputation to risk (higher rep = lower risk)
          status = result.reputation || 'UNKNOWN';
        } else {
          return;
        }
        break;
        
      default:
        return; // Skip unknown services
    }
    
    validScores.push({ serviceName, scorePercent, status, key });
  });
  
  countElement.textContent = `(${validScores.length}/3)`;
  
  container.innerHTML = '';
  
  if (validScores.length === 0) {
    container.innerHTML = '<div class="result-item"><span>No trust scores available</span></div>';
    return;
  }
  
  validScores.forEach(({ serviceName, scorePercent, status }) => {
    const item = document.createElement('div');
    item.className = 'result-item';
    
    // Determine color based on risk score
    const scoreClass = scorePercent >= 70 ? 'phishing' : 
                     scorePercent >= 30 ? 'suspicious' : 'safe';
    
    item.innerHTML = `
      <span class="result-name">${serviceName}</span>
      <span class="result-score ${scoreClass}">${scorePercent}% (${status})</span>
    `;
    
    container.appendChild(item);
  });
}

// Update risk factors
function updateRiskFactors(factors) {
  const container = document.getElementById('riskFactors');
  
  container.innerHTML = '';
  
  if (!factors || factors.length === 0) {
    container.innerHTML = '<div class="risk-factor">No specific risk factors identified</div>';
    return;
  }
  
  factors.forEach(factor => {
    const item = document.createElement('div');
    item.className = 'risk-factor';
    item.textContent = factor;
    container.appendChild(item);
  });
}

// UI state management
function showLoading() {
  loadingState.classList.remove('hidden');
  mainContent.classList.add('hidden');
  errorState.classList.add('hidden');
}

function showMainContent() {
  loadingState.classList.add('hidden');
  mainContent.classList.remove('hidden');
  errorState.classList.add('hidden');
}

function showError(title, message) {
  loadingState.classList.add('hidden');
  mainContent.classList.add('hidden');
  errorState.classList.remove('hidden');
  
  document.querySelector('.error-state h3').textContent = title;
  document.getElementById('errorMessage').textContent = message;
}

function hideLoading() {
  loadingState.classList.add('hidden');
}

function hideError() {
  errorState.classList.add('hidden');
}

// Event handlers
function toggleDetailedView() {
  if (showDetailedToggle.checked) {
    detailedResults.classList.remove('hidden');
  } else {
    detailedResults.classList.add('hidden');
  }
}

async function refreshAnalysis() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await forceAnalysis(tab);
  } catch (error) {
    showError('Refresh failed', error.message);
  }
}

async function retryAnalysis() {
  await loadCurrentTabAnalysis();
}

function reportIssue() {
  // Open reporting form or email
  chrome.tabs.create({
    url: 'mailto:support@phishingdetector.com?subject=Phishing%20Detector%20Issue'
  });
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}

function showHelp() {
  // Create help modal or open help page
  alert('Phishing Detector Pro Help\n\n' +
        'This extension analyzes websites for phishing threats using:\n' +
        '• Multiple AI models trained on phishing datasets\n' +
        '• Public threat intelligence services\n' +
        '• Advanced ensemble decision engine\n\n' +
        'Risk Levels:\n' +
        '• SAFE (0-29%): Low risk, likely legitimate\n' +
        '• SUSPICIOUS (30-69%): Medium risk, exercise caution\n' +
        '• PHISHING (70-100%): High risk, likely malicious\n\n' +
        'Configure settings by clicking the gear icon.');
}

// Apply theme based on user preference
async function applyTheme() {
  try {
    const config = await chrome.storage.sync.get('phishing_detector_config');
    const darkMode = config.phishing_detector_config?.ui?.darkMode;
    
    if (darkMode) {
      document.body.classList.add('dark-mode');
    }
  } catch (error) {
    console.error('Error applying theme:', error);
  }
}

// Initialize theme
applyTheme();
