// Content script for phishing detection
(function() {
  'use strict';

  let currentUrl = window.location.href;
  let isAnalyzing = false;

  // Initialize content script
  function init() {
    console.log('Phishing Detector content script loaded');
    
    // Monitor URL changes (for SPAs)
    observeURLChanges();
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Initial analysis trigger
    notifyBackgroundOfNavigation();
  }

  // Observe URL changes for Single Page Applications
  function observeURLChanges() {
    let lastUrl = currentUrl;
    
    // Override pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(history, arguments);
      handleURLChange();
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(history, arguments);
      handleURLChange();
    };
    
    // Listen for popstate events
    window.addEventListener('popstate', handleURLChange);
    
    // Periodically check for URL changes (fallback)
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        handleURLChange();
      }
    }, 1000);
  }

  // Handle URL changes
  function handleURLChange() {
    const newUrl = window.location.href;
    
    if (newUrl !== currentUrl && !isAnalyzing) {
      currentUrl = newUrl;
      console.log('URL changed to:', currentUrl);
      notifyBackgroundOfNavigation();
    }
  }

  // Notify background script of navigation
  function notifyBackgroundOfNavigation() {
    if (isAnalyzing) return;
    
    isAnalyzing = true;
    
    // Small delay to ensure page is ready
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'pageNavigation',
        url: currentUrl,
        timestamp: Date.now(),
        pageTitle: document.title,
        referrer: document.referrer
      }).catch(error => {
        console.error('Error notifying background script:', error);
      }).finally(() => {
        isAnalyzing = false;
      });
    }, 100);
  }

  // Handle messages from background script
  function handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'getPageInfo':
        sendResponse(getPageInfo());
        break;
        
      case 'showWarning':
        showInPageWarning(request.data);
        sendResponse({ success: true });
        break;
        
      case 'hideWarning':
        hideInPageWarning();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  // Get page information for analysis
  function getPageInfo() {
    try {
      return {
        url: currentUrl,
        title: document.title,
        domain: window.location.hostname,
        protocol: window.location.protocol,
        hasSSL: window.location.protocol === 'https:',
        referrer: document.referrer,
        hasLoginForms: document.querySelectorAll('input[type="password"]').length > 0,
        hasPaymentForms: hasPaymentIndicators(),
        suspiciousElements: findSuspiciousElements(),
        metaInfo: getMetaInfo(),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting page info:', error);
      return null;
    }
  }

  // Check for payment-related indicators
  function hasPaymentIndicators() {
    const paymentKeywords = ['payment', 'billing', 'credit card', 'paypal', 'checkout'];
    const textContent = document.body.textContent.toLowerCase();
    
    return paymentKeywords.some(keyword => textContent.includes(keyword));
  }

  // Find suspicious elements on the page
  function findSuspiciousElements() {
    const suspicious = [];
    
    // Check for suspicious links
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.includes('bit.ly') || href.includes('tinyurl') || href.includes('t.co'))) {
        suspicious.push({
          type: 'shortlink',
          element: 'link',
          href: href,
          text: link.textContent.trim().substring(0, 50)
        });
      }
    });
    
    // Check for suspicious forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const action = form.getAttribute('action');
      if (action && action.startsWith('http') && !action.includes(window.location.hostname)) {
        suspicious.push({
          type: 'external_form',
          element: 'form',
          action: action
        });
      }
    });
    
    // Check for suspicious iframes
    const iframes = document.querySelectorAll('iframe[src]');
    iframes.forEach(iframe => {
      const src = iframe.getAttribute('src');
      if (src && src.startsWith('http') && !src.includes(window.location.hostname)) {
        suspicious.push({
          type: 'external_iframe',
          element: 'iframe',
          src: src
        });
      }
    });
    
    return suspicious.slice(0, 10); // Limit to avoid large payloads
  }

  // Get meta information from page
  function getMetaInfo() {
    const meta = {};
    
    // Get meta tags
    const metaTags = document.querySelectorAll('meta[name], meta[property]');
    metaTags.forEach(tag => {
      const name = tag.getAttribute('name') || tag.getAttribute('property');
      const content = tag.getAttribute('content');
      if (name && content) {
        meta[name] = content;
      }
    });
    
    return meta;
  }

  // Show in-page warning overlay
  function showInPageWarning(data) {
    // Remove existing warning if present
    hideInPageWarning();
    
    const warningOverlay = document.createElement('div');
    warningOverlay.id = 'phishing-detector-warning';
    warningOverlay.innerHTML = `
      <div class="warning-content">
        <div class="warning-header">
          <span class="warning-icon">⚠️</span>
          <h2>Phishing Warning</h2>
        </div>
        <p>This website has been flagged as potentially dangerous.</p>
        <div class="warning-details">
          <p><strong>Risk Level:</strong> ${data.riskPercentage}%</p>
          <p><strong>Recommendation:</strong> ${data.recommendation}</p>
        </div>
        <div class="warning-actions">
          <button id="warning-proceed" class="btn-proceed">I understand the risks - Continue</button>
          <button id="warning-back" class="btn-back">Go Back to Safety</button>
        </div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #phishing-detector-warning {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      
      .warning-content {
        background: white;
        border-radius: 12px;
        padding: 32px;
        max-width: 500px;
        margin: 20px;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      }
      
      .warning-header {
        margin-bottom: 16px;
      }
      
      .warning-icon {
        font-size: 48px;
        display: block;
        margin-bottom: 8px;
      }
      
      .warning-content h2 {
        color: #d73027;
        font-size: 24px;
        margin: 0;
      }
      
      .warning-content p {
        margin: 16px 0;
        color: #333;
      }
      
      .warning-details {
        background: #f8f9fa;
        border-radius: 6px;
        padding: 16px;
        margin: 16px 0;
        text-align: left;
      }
      
      .warning-actions {
        margin-top: 24px;
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      
      .warning-actions button {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .btn-proceed {
        background: #6c757d;
        color: white;
      }
      
      .btn-proceed:hover {
        background: #545b62;
      }
      
      .btn-back {
        background: #28a745;
        color: white;
      }
      
      .btn-back:hover {
        background: #1e7e34;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(warningOverlay);
    
    // Add event listeners
    document.getElementById('warning-proceed').addEventListener('click', () => {
      hideInPageWarning();
    });
    
    document.getElementById('warning-back').addEventListener('click', () => {
      window.history.back();
    });
  }

  // Hide in-page warning
  function hideInPageWarning() {
    const existing = document.getElementById('phishing-detector-warning');
    if (existing) {
      existing.remove();
    }
  }

  // Extract page features for enhanced analysis
  function extractPageFeatures() {
    try {
      return {
        hasLoginForm: document.querySelectorAll('input[type="password"]').length > 0,
        hasPaymentForm: document.querySelectorAll('input[type="text"][name*="card"], input[type="text"][placeholder*="card"]').length > 0,
        externalLinks: document.querySelectorAll('a[href^="http"]').length,
        totalLinks: document.querySelectorAll('a[href]').length,
        hasSSLCert: window.location.protocol === 'https:',
        domainAge: null, // Would need external service
        hasContactInfo: /contact|support|help/i.test(document.body.textContent),
        suspiciousKeywords: countSuspiciousKeywords(),
        formCount: document.querySelectorAll('form').length,
        iframeCount: document.querySelectorAll('iframe').length,
        scriptCount: document.querySelectorAll('script').length
      };
    } catch (error) {
      console.error('Error extracting page features:', error);
      return {};
    }
  }

  // Count suspicious keywords in page content
  function countSuspiciousKeywords() {
    const keywords = [
      'verify account', 'suspend', 'urgent', 'immediate action',
      'click here', 'act now', 'limited time', 'expires today',
      'confirm identity', 'update payment', 'security alert'
    ];
    
    const text = document.body.textContent.toLowerCase();
    return keywords.filter(keyword => text.includes(keyword)).length;
  }

  // Monitor for dynamic content changes
  function observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      let significantChange = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if added nodes contain forms or suspicious elements
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === 'FORM' || 
                  node.querySelector && node.querySelector('form, input[type="password"]')) {
                significantChange = true;
              }
            }
          });
        }
      });
      
      if (significantChange) {
        console.log('Significant page change detected, re-analyzing...');
        notifyBackgroundOfNavigation();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      observePageChanges();
    });
  } else {
    init();
    observePageChanges();
  }

})();
