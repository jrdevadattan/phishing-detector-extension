// Domain reputation and analysis functions
export class DomainAnalyzer {
  constructor() {
    // Patterns that indicate potential phishing
    this.suspiciousPatterns = {
      tld: /\.(xyz|top|work|date|loan|agency)$/i,
      numbers: /\d{4,}/,
      specialChars: /[-_.]{2,}/,
      mixedChars: /[^a-zA-Z0-9-_.]/
    };
  }

  analyzeURL(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const baseDomain = this.getBaseDomain(domain);
      
      // Get domain age if available
      const domainAge = this.getDomainAge(domain);
      
      // Check if the domain is a known legitimate one
      if (this.isKnownLegitimate(domain)) {
        return {
          score: 0.1, // Very low risk
          confidence: 0.95,
          reputation: "TRUSTED",
          details: {
            isLegitimate: true,
            age: domainAge,
            analysis: "Known legitimate domain"
          }
        };
      }

      // Initialize score (0 = safe, 1 = risky)
      let score = 0.5; // Start neutral
      let reasons = [];

      // Check for suspicious TLD
      if (this.suspiciousPatterns.tld.test(domain)) {
        score += 0.1;
        reasons.push("Suspicious TLD");
      }

      // Check for excessive numbers
      if (this.suspiciousPatterns.numbers.test(baseDomain)) {
        score += 0.1;
        reasons.push("Excessive numbers in domain");
      }

      // Check for multiple special characters
      if (this.suspiciousPatterns.specialChars.test(baseDomain)) {
        score += 0.1;
        reasons.push("Multiple special characters");
      }

      // Check for unusual characters
      if (this.suspiciousPatterns.mixedChars.test(baseDomain)) {
        score += 0.15;
        reasons.push("Unusual characters in domain");
      }

      // Check for domain age
      if (domainAge && domainAge < 30) { // domain less than 30 days old
        score += 0.2;
        reasons.push("Recently registered domain");
      }

      // Check for brand impersonation
      const impersonation = this.checkBrandImpersonation(baseDomain);
      if (impersonation.detected) {
        score = Math.max(score + 0.3, 0.8); // Significant risk increase
        reasons.push(`Possible ${impersonation.brand} impersonation`);
      }

      // Get reputation category
      const reputation = this.getReputationCategory(score);

      return {
        score: score,
        confidence: 0.8,
        reputation: reputation,
        details: {
          isLegitimate: score < 0.3,
          age: domainAge,
          analysis: reasons.join(", ") || "No suspicious patterns detected",
          impersonation: impersonation.detected ? impersonation.brand : null
        }
      };
    } catch (error) {
      console.error("Domain analysis error:", error);
      return {
        score: 0.5,
        confidence: 0.3,
        reputation: "UNKNOWN",
        details: {
          error: "Analysis failed",
          message: error.message
        }
      };
    }
  }

  getBaseDomain(domain) {
    // Remove www. prefix if present
    domain = domain.replace(/^www\./, '');
    // Get the main part of the domain (without subdomains)
    const parts = domain.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    return domain;
  }

  checkBrandImpersonation(domain) {
    // List of major brands to check for impersonation
    const brands = {
      'facebook': ['facebook', 'fb', 'facebok', 'facbook'],
      'google': ['google', 'gogle', 'googl'],
      'microsoft': ['microsoft', 'microsft', 'micros0ft'],
      'apple': ['apple', 'aple', 'appel'],
      'amazon': ['amazon', 'amzon', 'amazn'],
      'paypal': ['paypal', 'paypl', 'paypel'],
      'netflix': ['netflix', 'netflx', 'netfix'],
      'instagram': ['instagram', 'insta'],
      'twitter': ['twitter', 'twiter'],
      'linkedin': ['linkedin', 'linkdin']
    };

    // Don't check for impersonation if it's an exact match with a brand
    for (const [brand, variations] of Object.entries(brands)) {
      if (domain === brand + '.com') {
        return { detected: false };
      }
    }

    // Check for brand impersonation
    for (const [brand, variations] of Object.entries(brands)) {
      for (const variation of variations) {
        // Use more precise pattern matching to avoid false positives
        const pattern = new RegExp(`${variation}[^a-z]|[^a-z]${variation}|^${variation}|${variation}$`, 'i');
        if (pattern.test(domain) && !this.isKnownLegitimate(domain)) {
          return { detected: true, brand: brand.toUpperCase() };
        }
      }
    }

    return { detected: false };
  }

  getReputationCategory(score) {
    if (score < 0.2) return "TRUSTED";
    if (score < 0.4) return "GOOD";
    if (score < 0.6) return "NEUTRAL";
    if (score < 0.8) return "SUSPICIOUS";
    return "HIGH_RISK";
  }

  isKnownLegitimate(domain) {
    // Common legitimate TLDs
    const legitimateTLDs = [
      '.gov', '.mil', '.edu',
      '.gov.uk', '.nhs.uk', '.police.uk',
      '.gc.ca', '.gouv.fr', '.gov.au'
    ];

    // Check for legitimate TLDs
    return legitimateTLDs.some(tld => domain.endsWith(tld));
  }

  getDomainAge(domain) {
    // In a real implementation, this would query WHOIS or a domain age API
    // For now, return null to indicate unknown age
    return null;
  }
}