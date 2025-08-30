// Simplified background script for Phishing Detector Pro
// This version works without ES6 modules for easier Chrome loading

// Simple configuration
const DEFAULT_CONFIG = {
  enabled: true,
  aiModelsEnabled: true,
  trustScoresEnabled: true,
  riskThreshold: 70,
  showNotifications: true,
  autoBlock: false,
  cacheExpiry: 60,
  models: {
    vrbancic: true,
    kaggle: true,
    mendeley: true,
    huggingface: true,
    ieee: true,
    phishofe: true,
    zenodo: true
  },
  trustSources: {
    googleSafeBrowsing: true,
    virusTotal: true,
    urlVoid: false,
    phishTank: false
  }
};

// Comprehensive trusted domains whitelist
const TRUSTED_DOMAINS = [
  // Google Services
  'google.com', 'www.google.com', 'gmail.com', 'youtube.com', 'drive.google.com',
  'maps.google.com', 'docs.google.com', 'photos.google.com', 'play.google.com',
  'accounts.google.com', 'myaccount.google.com', 'support.google.com',
  
  // Major E-commerce
  'amazon.com', 'www.amazon.com', 'smile.amazon.com', 'aws.amazon.com',
  'ebay.com', 'www.ebay.com', 'etsy.com', 'www.etsy.com',
  
  // Financial Services
  'paypal.com', 'www.paypal.com', 'stripe.com', 'square.com',
  
  // Tech Companies
  'microsoft.com', 'www.microsoft.com', 'outlook.com', 'office.com', 'live.com',
  'apple.com', 'www.apple.com', 'icloud.com', 'developer.apple.com',
  'facebook.com', 'www.facebook.com', 'instagram.com', 'whatsapp.com', 'meta.com',
  
  // Developer/Tech Sites
  'github.com', 'www.github.com', 'gitlab.com', 'stackoverflow.com',
  'stackexchange.com', 'npmjs.com', 'docker.com', 'aws.com',
  
  // News and Media
  'reddit.com', 'www.reddit.com', 'twitter.com', 'x.com', 'linkedin.com',
  'cnn.com', 'bbc.com', 'nytimes.com', 'washingtonpost.com',
  
  // Educational and Reference
  'wikipedia.org', 'mozilla.org', 'w3.org', 'ietf.org',
  
  // CDN and Infrastructure
  'cloudflare.com', 'jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com'
];

// Advanced phishing detection algorithm
function predictPhishing(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();
    
    // Step 1: Check trusted domains first (highest priority)
    const isTrustedDomain = TRUSTED_DOMAINS.some(trusted => 
      hostname === trusted.toLowerCase() || hostname.endsWith('.' + trusted.toLowerCase())
    );
    
    if (isTrustedDomain) {
      return {
        riskPercentage: 2, // Nearly zero risk for verified trusted domains
        confidence: 0.99,
        recommendation: 'SAFE',
        factors: ['✅ Verified trusted domain - authentic site'],
        features: extractAdvancedFeatures(url),
        timestamp: Date.now()
      };
    }
    
    // Step 2: Advanced feature extraction and analysis
    const features = extractAdvancedFeatures(url);
    let riskScore = 0;
    let factors = [];
    let confidence = 0.7;
    
    // Critical Risk Factors (Immediate High Risk)
    
    // 1. IP Address Usage (90% risk)
    if (features.isIPAddress) {
      riskScore = Math.max(riskScore, 0.90);
      factors.push('🚨 CRITICAL: Using IP address instead of domain name');
      confidence = 0.95;
    }
    
    // 2. Brand Impersonation (85% risk)
    if (features.brandImpersonation.detected) {
      riskScore = Math.max(riskScore, 0.85);
      factors.push(`🚨 CRITICAL: Impersonating ${features.brandImpersonation.brands.join(', ')}`);
      confidence = 0.90;
    }
    
    // 3. Suspicious TLD combinations (75% risk)
    if (features.suspiciousTLD) {
      riskScore = Math.max(riskScore, 0.75);
      factors.push('🚨 Suspicious top-level domain usage');
      confidence = 0.85;
    }
    
    // High Risk Factors
    
    // 4. Phishing Keywords (weighted)
    if (features.phishingKeywords.count >= 3) {
      riskScore += 0.40;
      factors.push(`⚠️ Multiple phishing keywords detected (${features.phishingKeywords.found.join(', ')})`);
    } else if (features.phishingKeywords.count >= 1) {
      riskScore += 0.20;
      factors.push(`⚠️ Phishing keywords: ${features.phishingKeywords.found.join(', ')}`);
    }
    
    // 5. Domain Age and Structure
    if (features.homographAttack) {
      riskScore += 0.35;
      factors.push('⚠️ Potential homograph/lookalike domain attack');
    }
    
    if (features.suspiciousDomainStructure.score > 0.3) {
      riskScore += features.suspiciousDomainStructure.score;
      factors.push(`⚠️ Suspicious domain structure: ${features.suspiciousDomainStructure.reasons.join(', ')}`);
    }
    
    // Medium Risk Factors
    
    // 6. URL Length (extreme lengths)
    if (features.urlLength > 200) {
      riskScore += 0.25;
      factors.push('⚠️ Extremely long URL (possible obfuscation)');
    } else if (features.urlLength > 150) {
      riskScore += 0.15;
      factors.push('⚠️ Very long URL');
    }
    
    // 7. Security Issues
    if (!features.hasHTTPS) {
      riskScore += 0.25;
      factors.push('⚠️ No HTTPS encryption (insecure connection)');
    }
    
    // 8. URL Complexity
    if (features.pathComplexity.score > 0.2) {
      riskScore += features.pathComplexity.score;
      factors.push(`⚠️ Complex URL structure: ${features.pathComplexity.reasons.join(', ')}`);
    }
    
    // Low Risk Factors
    
    // 9. URL Shorteners (moderate risk)
    if (features.isShortener) {
      riskScore += 0.10;
      factors.push('ℹ️ URL shortening service (verify destination)');
    }
    
    // 10. Subdomain Analysis
    if (features.subdomainRisk.score > 0.1) {
      riskScore += features.subdomainRisk.score;
      factors.push(`ℹ️ ${features.subdomainRisk.reason}`);
    }
    
    // Convert to percentage and apply smart capping
    let riskPercentage = Math.min(Math.round(riskScore * 100), 95);
    
    // Smart adjustment: if multiple low-risk factors, don't exceed medium risk
    if (factors.length >= 3 && riskPercentage < 50) {
      riskPercentage = Math.min(riskPercentage, 45);
    }
    
    // Final recommendation
    let recommendation;
    if (riskPercentage >= 75) {
      recommendation = 'PHISHING';
      confidence = Math.max(confidence, 0.85);
    } else if (riskPercentage >= 40) {
      recommendation = 'SUSPICIOUS';
      confidence = Math.max(confidence, 0.75);
    } else if (riskPercentage >= 15) {
      recommendation = 'LOW_RISK';
      confidence = Math.max(confidence, 0.70);
    } else {
      recommendation = 'SAFE';
      confidence = Math.max(confidence, 0.80);
    }
    
    return {
      riskPercentage,
      confidence: Math.min(confidence, 0.99),
      recommendation,
      factors: factors.length > 0 ? factors : ['✅ No significant risk factors detected'],
      features,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error in phishing prediction:', error);
    return {
      riskPercentage: 50,
      confidence: 0.1,
      recommendation: 'UNKNOWN',
      factors: ['❌ Error analyzing URL'],
      features: {},
      timestamp: Date.now()
    };
  }
}

// Advanced URL feature extraction
function extractAdvancedFeatures(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const path = urlObj.pathname;
    const fullUrl = url.toLowerCase();
    
    // 1. Basic metrics
    const urlLength = url.length;
    const hasHTTPS = urlObj.protocol === 'https:';
    const numDots = (hostname.match(/\./g) || []).length;
    const subdomains = hostname.split('.').slice(0, -2); // Remove domain and TLD
    const numSubdomains = subdomains.length;
    
    // 2. IP Address Detection
    const isIPAddress = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(hostname);
    
    // 3. URL Shortener Detection
    const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'short.link', 'is.gd', 'v.gd', 'x.co'];
    const isShortener = shorteners.includes(hostname);
    
    // 4. Advanced Phishing Keywords
    const phishingKeywords = [
      'verify', 'confirm', 'update', 'suspend', 'urgent', 'expire', 'limited', 'act-now',
      'click-here', 'security', 'alert', 'warning', 'blocked', 'restricted', 'locked',
      'validation', 'authentication', 'login-verification', 'account-verification',
      'billing', 'payment', 'invoice', 'refund', 'prize', 'winner', 'congratulations'
    ];
    
    const foundKeywords = phishingKeywords.filter(keyword => fullUrl.includes(keyword));
    const phishingKeywordsObj = {
      count: foundKeywords.length,
      found: foundKeywords
    };
    
    // 5. Brand Impersonation Detection
    const brandWords = {
      'paypal': ['paypal', 'pay-pal', 'paipal', 'payp4l'],
      'amazon': ['amazon', 'amaz0n', 'amazom', 'amaozn'],
      'apple': ['apple', 'app1e', 'appl3', 'aple'],
      'microsoft': ['microsoft', 'microsft', 'micr0soft', 'mircosoft'],
      'google': ['google', 'g00gle', 'googl3', 'goog1e'],
      'facebook': ['facebook', 'faceb00k', 'facebok', 'fb'],
      'bank': ['bank', 'banking', 'b4nk', 'bankimg']
    };
    
    const brandImpersonation = { detected: false, brands: [] };
    
    for (const [brand, variations] of Object.entries(brandWords)) {
      for (const variation of variations) {
        if (hostname.includes(variation) && !hostname.includes(brand + '.com')) {
          // Only flag if it's not the actual brand domain
          const isFakeBrand = !TRUSTED_DOMAINS.some(trusted => hostname.endsWith(trusted.toLowerCase()));
          if (isFakeBrand) {
            brandImpersonation.detected = true;
            brandImpersonation.brands.push(brand.toUpperCase());
            break;
          }
        }
      }
    }
    
    // 6. Suspicious TLD Detection
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.top', '.click', '.download', '.stream', '.zip'];
    const tld = hostname.substring(hostname.lastIndexOf('.'));
    const suspiciousTLD = suspiciousTLDs.includes(tld);
    
    // 7. Homograph Attack Detection (lookalike domains)
    const homographChars = /[а-я]|[αβγδε]|[àáâãäåæçèéêë]/; // Cyrillic, Greek, accented chars
    const homographAttack = homographChars.test(hostname);
    
    // 8. Domain Structure Analysis
    const suspiciousDomainStructure = analyzeDomainStructure(hostname);
    
    // 9. Path Complexity Analysis
    const pathComplexity = analyzePathComplexity(path, urlObj.search);
    
    // 10. Subdomain Risk Analysis
    const subdomainRisk = analyzeSubdomainRisk(subdomains, hostname);
    
    return {
      urlLength,
      hasHTTPS,
      numDots,
      numSubdomains,
      isIPAddress,
      isShortener,
      phishingKeywords: phishingKeywordsObj,
      brandImpersonation,
      suspiciousTLD,
      homographAttack,
      suspiciousDomainStructure,
      pathComplexity,
      subdomainRisk
    };
  } catch (error) {
    console.error('Error extracting advanced features:', error);
    return {};
  }
}

// Analyze domain structure for suspicious patterns
function analyzeDomainStructure(hostname) {
  let score = 0;
  const reasons = [];
  
  // Multiple hyphens (domain-like-this-one.com)
  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    score += 0.30;
    reasons.push('excessive hyphens');
  } else if (hyphenCount >= 2) {
    score += 0.15;
    reasons.push('multiple hyphens');
  }
  
  // Numbers in domain (suspicious for brands)
  if (/\d+/.test(hostname.replace(/\.\w+$/, ''))) { // Exclude TLD
    score += 0.20;
    reasons.push('numbers in domain name');
  }
  
  // Very long domain names
  const domainPart = hostname.split('.')[0];
  if (domainPart.length > 20) {
    score += 0.25;
    reasons.push('extremely long domain name');
  } else if (domainPart.length > 15) {
    score += 0.10;
    reasons.push('very long domain name');
  }
  
  // Double extensions (.com.evil.com)
  const parts = hostname.split('.');
  if (parts.length > 3) {
    const possibleDoubleExt = parts.slice(-3, -1).join('.');
    if (['com.br', 'co.uk', 'com.au'].includes(possibleDoubleExt)) {
      // Legitimate country domains
    } else if (possibleDoubleExt.includes('com') || possibleDoubleExt.includes('org')) {
      score += 0.40;
      reasons.push('suspicious domain extension pattern');
    }
  }
  
  return { score, reasons };
}

// Analyze URL path complexity
function analyzePathComplexity(path, search) {
  let score = 0;
  const reasons = [];
  
  // Path depth
  const pathParts = path.split('/').filter(part => part.length > 0);
  if (pathParts.length > 8) {
    score += 0.20;
    reasons.push('extremely deep path structure');
  } else if (pathParts.length > 5) {
    score += 0.10;
    reasons.push('complex path structure');
  }
  
  // Suspicious path patterns
  const suspiciousPathPatterns = [
    /login|signin|auth|verify|confirm/,
    /update|upgrade|renew/,
    /security|secure|protection/,
    /billing|payment|invoice/,
    /account|profile|settings/
  ];
  
  const pathText = (path + search).toLowerCase();
  const suspiciousPathCount = suspiciousPathPatterns.filter(pattern => pattern.test(pathText)).length;
  
  if (suspiciousPathCount >= 2) {
    score += 0.25;
    reasons.push('multiple suspicious path elements');
  } else if (suspiciousPathCount >= 1) {
    score += 0.10;
    reasons.push('suspicious path elements');
  }
  
  // Query string complexity
  if (search.length > 200) {
    score += 0.15;
    reasons.push('extremely complex query parameters');
  } else if (search.length > 100) {
    score += 0.05;
    reasons.push('complex query parameters');
  }
  
  return { score, reasons };
}

// Analyze subdomain risk
function analyzeSubdomainRisk(subdomains, hostname) {
  if (subdomains.length === 0) {
    return { score: 0, reason: 'No subdomains' };
  }
  
  // Too many subdomains
  if (subdomains.length > 4) {
    return { score: 0.20, reason: 'Excessive subdomains (possible subdomain abuse)' };
  }
  
  if (subdomains.length > 2) {
    return { score: 0.10, reason: 'Multiple subdomains' };
  }
  
  // Check for suspicious subdomain patterns
  const suspiciousSubdomains = ['secure', 'login', 'account', 'verify', 'auth', 'www-', 'mail-', 'web-'];
  const hasSuspiciousSubdomain = subdomains.some(sub => 
    suspiciousSubdomains.some(suspicious => sub.includes(suspicious))
  );
  
  if (hasSuspiciousSubdomain) {
    return { score: 0.15, reason: 'Suspicious subdomain detected' };
  }
  
  return { score: 0, reason: 'Normal subdomain usage' };
}

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Phishing Detector Pro installed');
  
  // Set default configuration
  const existing = await chrome.storage.sync.get('phishing_detector_config');
  if (!existing.phishing_detector_config) {
    await chrome.storage.sync.set({
      phishing_detector_config: DEFAULT_CONFIG
    });
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
    // Skip chrome:// and extension URLs
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return;
    }
    
    // Get configuration
    const configResult = await chrome.storage.sync.get('phishing_detector_config');
    const config = configResult.phishing_detector_config || DEFAULT_CONFIG;
    
    if (!config.enabled) return;
    
    // Check cache first
    const cacheKey = `cache_${btoa(url)}`;
    const cachedResult = await chrome.storage.local.get(cacheKey);
    
    if (cachedResult[cacheKey] && !isExpired(cachedResult[cacheKey].timestamp, config.cacheExpiry)) {
      await handleResult(cachedResult[cacheKey].result, url, tabId, config);
      return;
    }
    
    // First check trust scores (higher priority)
    const trustScores = await getTrustScores(url, config);
    
    // Then get heuristic analysis
    const heuristicResult = predictPhishing(url);
    
    // Combine results with trust scores having priority
    const combinedResult = combineResults(heuristicResult, trustScores);
    
    // Create full result structure
    const fullResult = {
      url,
      timestamp: Date.now(),
      aiModels: {
        simple_heuristic: {
          modelName: 'Simple Heuristic Model',
          score: heuristicResult.riskPercentage / 100,
          confidence: heuristicResult.confidence,
          prediction: heuristicResult.recommendation.toLowerCase(),
          timestamp: Date.now()
        }
      },
      trustScores: trustScores,
      ensemble: {
        riskPercentage: combinedResult.riskPercentage,
        confidence: combinedResult.confidence,
        recommendation: combinedResult.recommendation,
        breakdown: {
          factors: combinedResult.factors,
          summary: `Risk: ${combinedResult.riskPercentage}% (${combinedResult.recommendation})`
        }
      }
    };
    
    // Cache result
    await chrome.storage.local.set({
      [cacheKey]: {
        result: fullResult,
        timestamp: Date.now()
      }
    });
    
    // Handle result
    await handleResult(fullResult, url, tabId, config);
    
  } catch (error) {
    console.error('Error analyzing URL:', error);
  }
}

// Handle analysis results
async function handleResult(result, url, tabId, config) {
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
  
  try {
    await chrome.action.setBadgeText({ text, tabId });
    await chrome.action.setBadgeBackgroundColor({ color, tabId });
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Show warning notification
async function showWarningNotification(url, result) {
  try {
    const domain = new URL(url).hostname;
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Phishing Warning',
      message: `Suspicious website detected: ${domain}\nRisk: ${result.ensemble.riskPercentage}%`
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Block page (redirect to warning page)
async function blockPage(tabId, result) {
  try {
    const warningUrl = chrome.runtime.getURL('assets/warning.html') + 
      '?url=' + encodeURIComponent(result.url) + 
      '&risk=' + result.ensemble.riskPercentage;
    
    chrome.tabs.update(tabId, { url: warningUrl });
  } catch (error) {
    console.error('Error blocking page:', error);
  }
}

// Real Google Safe Browsing API integration
async function checkGoogleSafeBrowsing(url, apiKey) {
  try {
    // Google Safe Browsing API v4 endpoint
    const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
    
    const requestBody = {
      client: {
        clientId: 'phishing-detector-pro',
        clientVersion: '1.0.0'
      },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [
          { url: url }
        ]
      }
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Invalid API request');
      } else if (response.status === 401) {
        throw new Error('Invalid API key');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    }
    
    const data = await response.json();
    
    // Check if threats were found
    const threats = data.matches || [];
    const isSafe = threats.length === 0;
    
    return {
      serviceName: 'Google Safe Browsing',
      available: true,
      isSafe: isSafe,
      threats: threats.map(match => match.threatType),
      confidence: 0.95,
      lastUpdated: Date.now(),
      details: threats.length > 0 ? `${threats.length} threat(s) detected` : 'No threats detected'
    };
    
  } catch (error) {
    console.error('Google Safe Browsing API error:', error);
    
    // Return appropriate error based on error type
    let errorMessage = 'Service unavailable';
    if (error.message.includes('Invalid API key')) {
      errorMessage = 'Invalid API key - check your Google Safe Browsing API key';
    } else if (error.message.includes('Rate limit')) {
      errorMessage = 'Rate limit exceeded - try again later';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network error - check internet connection';
    }
    
    return {
      serviceName: 'Google Safe Browsing',
      available: false,
      error: errorMessage
    };
  }
}

// Get trust scores from external services
async function getTrustScores(url, config) {
  const trustScores = {};
  
  if (!config.trustScoresEnabled) {
    return trustScores;
  }
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Get API keys
    const apiKeys = await chrome.storage.local.get([
      'googleSafeBrowsingKey',
      'virusTotalKey'
    ]);
    
    // Google Safe Browsing
    if (config.trustSources.googleSafeBrowsing && apiKeys.googleSafeBrowsingKey) {
      try {
        const safeBrowsingResult = await checkGoogleSafeBrowsing(url, apiKeys.googleSafeBrowsingKey);
        trustScores.googleSafeBrowsing = safeBrowsingResult;
      } catch (error) {
        console.log('Google Safe Browsing API unavailable');
        trustScores.googleSafeBrowsing = {
          serviceName: 'Google Safe Browsing',
          available: false,
          error: 'API key not configured or service unavailable'
        };
      }
    } else {
      trustScores.googleSafeBrowsing = {
        serviceName: 'Google Safe Browsing',
        available: false,
        error: 'Service disabled or API key not configured'
      };
    }
    
    // VirusTotal
    if (config.trustSources.virusTotal && apiKeys.virusTotalKey) {
      try {
        const virusTotalResult = await checkVirusTotal(url, apiKeys.virusTotalKey);
        trustScores.virusTotal = virusTotalResult;
      } catch (error) {
        console.log('VirusTotal API unavailable');
        trustScores.virusTotal = {
          serviceName: 'VirusTotal',
          available: false,
          error: 'API key not configured or service unavailable'
        };
      }
    } else {
      trustScores.virusTotal = {
        serviceName: 'VirusTotal',
        available: false,
        error: 'Service disabled or API key not configured'
      };
    }
    
    // Add mock trust score based on domain reputation for demo
    trustScores.domainReputation = getDomainReputation(domain);
    
  } catch (error) {
    console.error('Error getting trust scores:', error);
  }
  
  return trustScores;
}


// Real VirusTotal API integration
async function checkVirusTotal(url, apiKey) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // First, get URL ID from VirusTotal
    const urlId = btoa(url).replace(/=/g, '');
    
    // Check if URL has been scanned before
    const scanResponse = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      method: 'GET',
      headers: {
        'x-apikey': apiKey
      }
    });
    
    if (scanResponse.status === 404) {
      // URL not found, submit for scanning
      const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: {
          'x-apikey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `url=${encodeURIComponent(url)}`
      });
      
      if (submitResponse.ok) {
        return {
          serviceName: 'VirusTotal',
          available: true,
          scanning: true,
          message: 'Submitted for scanning - check back later',
          permalink: `https://www.virustotal.com/gui/url/${urlId}`,
          confidence: 0.50
        };
      } else {
        throw new Error('Failed to submit URL for scanning');
      }
    }
    
    if (!scanResponse.ok) {
      if (scanResponse.status === 401) {
        throw new Error('Invalid API key');
      } else if (scanResponse.status === 429) {
        throw new Error('Rate limit exceeded');
      } else {
        throw new Error(`API error: ${scanResponse.status}`);
      }
    }
    
    const data = await scanResponse.json();
    const stats = data.data.attributes.last_analysis_stats;
    
    const positives = stats.malicious + stats.suspicious;
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    return {
      serviceName: 'VirusTotal',
      available: true,
      positives: positives,
      total: total,
      scanDate: data.data.attributes.last_analysis_date * 1000, // Convert to JS timestamp
      permalink: `https://www.virustotal.com/gui/url/${urlId}`,
      confidence: 0.90,
      stats: stats
    };
    
  } catch (error) {
    console.error('VirusTotal API error:', error);
    
    // Return appropriate error based on error type
    let errorMessage = 'Service unavailable';
    if (error.message.includes('Invalid API key')) {
      errorMessage = 'Invalid API key - check your VirusTotal API key';
    } else if (error.message.includes('Rate limit')) {
      errorMessage = 'Rate limit exceeded - try again later';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network error - check internet connection';
    }
    
    return {
      serviceName: 'VirusTotal',
      available: false,
      error: errorMessage
    };
  }
}

// Get domain reputation score
function getDomainReputation(domain) {
  // Check if trusted domain
  const isTrusted = TRUSTED_DOMAINS.some(trusted => 
    domain === trusted || domain.endsWith('.' + trusted)
  );
  
  if (isTrusted) {
    return {
      serviceName: 'Domain Reputation',
      available: true,
      score: 95,
      reputation: 'EXCELLENT',
      factors: ['Well-known trusted domain', 'High user trust'],
      confidence: 0.98
    };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /fake|phish|scam|malware|suspicious/i,
    /\d+\./,  // Starts with numbers
    /-{2,}/,  // Multiple dashes
    /temp-|tmp-|test-/i
  ];
  
  const suspiciousCount = suspiciousPatterns.filter(pattern => pattern.test(domain)).length;
  
  let score, reputation;
  if (suspiciousCount >= 2) {
    score = 15;
    reputation = 'POOR';
  } else if (suspiciousCount === 1) {
    score = 40;
    reputation = 'MODERATE';
  } else {
    score = 75;
    reputation = 'GOOD';
  }
  
  return {
    serviceName: 'Domain Reputation',
    available: true,
    score: score,
    reputation: reputation,
    factors: suspiciousCount > 0 ? ['Suspicious domain patterns detected'] : ['No obvious red flags'],
    confidence: 0.70
  };
}

// Combine results with trust scores having priority
function combineResults(heuristicResult, trustScores) {
  let finalRisk = heuristicResult.riskPercentage;
  let confidence = heuristicResult.confidence;
  let factors = [...heuristicResult.factors];
  
  // Trust scores take priority and can override AI models
  const trustResults = [];
  
  // Google Safe Browsing (highest priority)
  if (trustScores.googleSafeBrowsing && trustScores.googleSafeBrowsing.available) {
    if (!trustScores.googleSafeBrowsing.isSafe) {
      finalRisk = Math.max(finalRisk, 90); // High risk if flagged
      factors.unshift('⚠️ Google Safe Browsing: Unsafe site detected');
      confidence = Math.max(confidence, 0.95);
    } else {
      finalRisk = Math.min(finalRisk, 10); // Very low risk if verified safe
      factors.unshift('✅ Google Safe Browsing: Site verified safe');
      confidence = Math.max(confidence, 0.90);
    }
    trustResults.push('Google Safe Browsing');
  }
  
  // VirusTotal
  if (trustScores.virusTotal && trustScores.virusTotal.available) {
    const detectionRate = trustScores.virusTotal.positives / trustScores.virusTotal.total;
    if (detectionRate > 0.1) { // More than 10% detection
      finalRisk = Math.max(finalRisk, 80);
      factors.unshift(`⚠️ VirusTotal: ${trustScores.virusTotal.positives}/${trustScores.virusTotal.total} engines flagged as malicious`);
      confidence = Math.max(confidence, 0.85);
    } else if (detectionRate === 0) {
      finalRisk = Math.min(finalRisk, 15);
      factors.unshift('✅ VirusTotal: Clean scan results');
      confidence = Math.max(confidence, 0.80);
    }
    trustResults.push('VirusTotal');
  }
  
  // Domain Reputation
  if (trustScores.domainReputation && trustScores.domainReputation.available) {
    const repScore = trustScores.domainReputation.score;
    if (repScore >= 80) {
      finalRisk = Math.min(finalRisk, 20);
      factors.unshift(`✅ Domain Reputation: ${trustScores.domainReputation.reputation} (${repScore}%)`);
    } else if (repScore <= 30) {
      finalRisk = Math.max(finalRisk, 60);
      factors.unshift(`⚠️ Domain Reputation: ${trustScores.domainReputation.reputation} (${repScore}%)`);
    } else {
      factors.unshift(`ℹ️ Domain Reputation: ${trustScores.domainReputation.reputation} (${repScore}%)`);
    }
    trustResults.push('Domain Reputation');
  }
  
  // Add trust sources info
  if (trustResults.length > 0) {
    factors.unshift(`🔍 Trust sources checked: ${trustResults.join(', ')}`);
  } else {
    factors.unshift('ℹ️ No trust score services available (configure API keys in settings)');
  }
  
  const recommendation = finalRisk >= 70 ? 'PHISHING' : finalRisk >= 30 ? 'SUSPICIOUS' : 'SAFE';
  
  return {
    riskPercentage: finalRisk,
    confidence: Math.min(confidence, 1.0),
    recommendation: recommendation,
    factors: factors
  };
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
          await chrome.storage.sync.set({
            phishing_detector_config: { ...DEFAULT_CONFIG, ...request.config }
          });
          sendResponse({ success: true });
          break;
          
        case 'clearCache':
          // Clear all cache entries
          const allData = await chrome.storage.local.get();
          const cacheKeys = Object.keys(allData).filter(key => key.startsWith('cache_'));
          if (cacheKeys.length > 0) {
            await chrome.storage.local.remove(cacheKeys);
          }
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
