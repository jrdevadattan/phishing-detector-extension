import { LEGITIMATE_DOMAINS } from './legitimate-domains.js';
import { DomainAnalyzer } from './domain-analyzer.js';

export class TrustScoreManager {
  constructor() {
    this.apiKeys = {};
    this.rateLimits = {
      googleSafeBrowsing: { calls: 0, resetTime: 0, limit: 10000 }, // Per day
      virusTotal: { calls: 0, resetTime: 0, limit: 500 } // Per day for free tier
    };
    this.legitDomains = LEGITIMATE_DOMAINS;
    this.domainAnalyzer = new DomainAnalyzer();
  }

  async getGoogleSafeBrowsing(url) {
    try {
      // Check rate limit
      if (!this.checkRateLimit('googleSafeBrowsing')) {
        return {
          service: 'Google Safe Browsing',
          score: null,
          error: 'Rate limit exceeded',
          timestamp: Date.now()
        };
      }

      // Get API key from storage
      const result = await chrome.storage.local.get('googleSafeBrowsingKey');
      const apiKey = result.googleSafeBrowsingKey;
      
      if (!apiKey) {
        return {
          service: 'Google Safe Browsing',
          score: null,
          error: 'API key not configured',
          timestamp: Date.now()
        };
      }

      const requestBody = {
        client: {
          clientId: 'legitly',
          clientVersion: '1.0.0'
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: url }]
        }
      };

      const response = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      this.updateRateLimit('googleSafeBrowsing');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const isPhishing = data.matches && data.matches.length > 0;
      
      // Parse the domain and check if it's a known legitimate domain
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const isKnownLegitimate = this.isKnownLegitimateDomain(domain);
      
      return {
        service: 'Google Safe Browsing',
        score: isKnownLegitimate ? 0.05 : (isPhishing ? 0.9 : 0.1),
        confidence: isKnownLegitimate ? 0.98 : 0.95,
        details: data.matches || [],
        isSafe: isKnownLegitimate || !isPhishing,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Google Safe Browsing API error:', error);
      return {
        service: 'Google Safe Browsing',
        score: null,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  async getVirusTotal(url) {
    try {
      // Check rate limit
      if (!this.checkRateLimit('virusTotal')) {
        return {
          service: 'VirusTotal',
          score: null,
          error: 'Rate limit exceeded',
          timestamp: Date.now()
        };
      }

      // Get API key from storage
      const result = await chrome.storage.local.get('virusTotalKey');
      const apiKey = result.virusTotalKey;
      
      if (!apiKey) {
        return {
          service: 'VirusTotal',
          score: null,
          error: 'API key not configured',
          timestamp: Date.now()
        };
      }

      // Encode URL for VirusTotal
      const encodedUrl = btoa(url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      const response = await fetch(
        `https://www.virustotal.com/api/v3/urls/${encodedUrl}`,
        {
          headers: {
            'x-apikey': apiKey
          }
        }
      );

      this.updateRateLimit('virusTotal');

      if (response.status === 404) {
        // URL not found in VirusTotal database
        return {
          service: 'VirusTotal',
          score: 0.5, // Neutral score for unknown URLs
          confidence: 0.3,
          details: { status: 'not_found' },
          isSafe: null,
          timestamp: Date.now()
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const stats = data.data.attributes.last_analysis_stats;
      
      const totalScans = stats.harmless + stats.malicious + stats.suspicious + stats.undetected;
      const maliciousRatio = totalScans > 0 ? (stats.malicious + stats.suspicious) / totalScans : 0;
      
      // Check if it's a known legitimate domain
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const isKnownLegitimate = this.isKnownLegitimateDomain(domain);
      
      // Adjust score for known legitimate domains
      const adjustedScore = isKnownLegitimate ? 
        Math.min(0.1, maliciousRatio) : // Cap score at 0.1 for legitimate domains
        maliciousRatio;
      
      return {
        service: 'VirusTotal',
        score: adjustedScore,
        confidence: isKnownLegitimate ? 0.98 : (totalScans > 10 ? 0.9 : 0.6),
        details: {
          harmless: stats.harmless,
          malicious: stats.malicious,
          suspicious: stats.suspicious,
          undetected: stats.undetected,
          total: totalScans,
          isKnownLegitimate
        },
        isSafe: isKnownLegitimate || maliciousRatio < 0.1,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('VirusTotal API error:', error);
      return {
        service: 'VirusTotal',
        score: null,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Additional trust score services can be added here
  async getURLVoid(url) {
    // Placeholder for URLVoid API integration
    return {
      service: 'URLVoid',
      score: Math.random(),
      confidence: 0.7,
      timestamp: Date.now()
    };
  }

  async getPhishTank(url) {
    // Placeholder for PhishTank API integration
    return {
      service: 'PhishTank',
      score: Math.random(),
      confidence: 0.8,
      timestamp: Date.now()
    };
  }

  checkRateLimit(service) {
    const limit = this.rateLimits[service];
    const now = Date.now();
    
    // Reset daily counter if needed
    if (now > limit.resetTime) {
      limit.calls = 0;
      limit.resetTime = now + (24 * 60 * 60 * 1000); // 24 hours
    }
    
    return limit.calls < limit.limit;
  }

  updateRateLimit(service) {
    this.rateLimits[service].calls++;
  }

  isKnownLegitimateDomain(domain) {
    // Remove 'www.' prefix if present
    domain = domain.replace(/^www\./, '');
    
    // Check exact domain match
    if (this.legitDomains.has(domain)) {
      return true;
    }
    
    // Check for government and educational domains
    if (domain.endsWith('.gov') || domain.endsWith('.mil') || domain.endsWith('.edu')) {
      return true;
    }
    
    // Check for subdomains of legitimate domains
    return Array.from(this.legitDomains).some(legitDomain => 
      domain.endsWith('.' + legitDomain)
    );
  }

  async getDomainReputation(url) {
    try {
      const analysis = this.domainAnalyzer.analyzeURL(url);
      
      return {
        service: 'Domain Reputation',
        score: analysis.score,
        confidence: analysis.confidence,
        details: analysis.details,
        reputation: analysis.reputation,
        isSafe: analysis.score < 0.4,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Domain reputation error:', error);
      return {
        service: 'Domain Reputation',
        score: 0.5,
        confidence: 0.3,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Aggregate multiple trust scores
  aggregateTrustScores(scores) {
    const validScores = Object.values(scores).filter(score => 
      score && typeof score.score === 'number' && !score.error
    );
    
    if (validScores.length === 0) {
      return {
        aggregatedScore: 0.5,
        confidence: 0.1,
        servicesUsed: 0
      };
    }

    // Weighted average based on confidence
    let weightedSum = 0;
    let totalWeight = 0;
    
    validScores.forEach(score => {
      const weight = score.confidence || 0.5;
      weightedSum += score.score * weight;
      totalWeight += weight;
    });

    const aggregatedScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    const averageConfidence = validScores.reduce((sum, score) => 
      sum + (score.confidence || 0.5), 0) / validScores.length;

    return {
      aggregatedScore,
      confidence: averageConfidence,
      servicesUsed: validScores.length,
      details: validScores
    };
  }
}
