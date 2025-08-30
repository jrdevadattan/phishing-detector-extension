// Import TensorFlow.js - fallback to CDN if local not available
let tf;
try {
  // Try to import from local installation
  tf = await import('@tensorflow/tfjs');
} catch (error) {
  console.log('Loading TensorFlow.js from CDN...');
  // Load from CDN as fallback
  if (typeof window !== 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js';
    document.head.appendChild(script);
    await new Promise(resolve => script.onload = resolve);
    tf = window.tf;
  } else {
    // In service worker context, use dynamic import
    tf = await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
  }
}

export class AIModelManager {
  constructor() {
    this.models = {};
    this.modelConfigs = {
      vrbancic: {
        name: 'Grega Vrbancic Phishing Model',
        path: 'models/vrbancic/model.json',
        features: ['url_length', 'num_dots', 'num_subdomains', 'has_https', 'suspicious_words']
      },
      kaggle: {
        name: 'Kaggle Web Page Phishing Model',
        path: 'models/kaggle/model.json',
        features: ['domain_age', 'url_entropy', 'tld_type', 'subdomain_count', 'path_depth']
      },
      mendeley: {
        name: 'Mendeley Phishing Model',
        path: 'models/mendeley/model.json',
        features: ['ip_address', 'shortening_service', 'prefix_suffix', 'having_sub_domain']
      },
      huggingface: {
        name: 'HuggingFace Phishing Model',
        path: 'models/huggingface/model.json',
        features: ['url_features', 'domain_features', 'page_features', 'whois_features']
      },
      ieee: {
        name: 'IEEE Dataport Phishing Model',
        path: 'models/ieee/model.json',
        features: ['lexical_features', 'host_features', 'content_features']
      },
      phishofe: {
        name: 'PhishOFE Model',
        path: 'models/phishofe/model.json',
        features: ['statistical_features', 'structural_features', 'behavioral_features']
      },
      zenodo: {
        name: 'Zenodo Phishing Model',
        path: 'models/zenodo/model.json',
        features: ['url_analysis', 'domain_analysis', 'content_analysis', 'network_analysis']
      }
    };
    
    this.featureExtractor = new URLFeatureExtractor();
  }

  async loadModels() {
    console.log('Loading AI models...');
    
    for (const [modelKey, config] of Object.entries(this.modelConfigs)) {
      try {
        const modelUrl = chrome.runtime.getURL(config.path);
        this.models[modelKey] = await tf.loadLayersModel(modelUrl);
        console.log(`Loaded model: ${config.name}`);
      } catch (error) {
        console.warn(`Failed to load model ${modelKey}:`, error);
        // Create a dummy model for demonstration purposes
        this.models[modelKey] = this.createDummyModel();
      }
    }
  }

  // Create a simple dummy model for demonstration
  createDummyModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 1, activation: 'sigmoid' })
      ]
    });
    return model;
  }

  async predictVrbancic(url) {
    return this.predict('vrbancic', url);
  }

  async predictKaggle(url) {
    return this.predict('kaggle', url);
  }

  async predictMendeley(url) {
    return this.predict('mendeley', url);
  }

  async predictHuggingFace(url) {
    return this.predict('huggingface', url);
  }

  async predictIEEE(url) {
    return this.predict('ieee', url);
  }

  async predictPhishOFE(url) {
    return this.predict('phishofe', url);
  }

  async predictZenodo(url) {
    return this.predict('zenodo', url);
  }

  async predict(modelKey, url) {
    try {
      const model = this.models[modelKey];
      if (!model) {
        throw new Error(`Model ${modelKey} not loaded`);
      }

      // Extract features based on model requirements
      const features = await this.featureExtractor.extractFeatures(url, this.modelConfigs[modelKey].features);
      
      // Convert features to tensor
      const inputTensor = tf.tensor2d([features]);
      
      // Make prediction
      const prediction = model.predict(inputTensor);
      const score = await prediction.data();
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      return {
        modelName: this.modelConfigs[modelKey].name,
        score: score[0],
        confidence: Math.abs(score[0] - 0.5) * 2, // Convert to confidence (0-1)
        prediction: score[0] > 0.5 ? 'phishing' : 'legitimate',
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error(`Error in model ${modelKey}:`, error);
      return {
        modelName: this.modelConfigs[modelKey].name,
        score: Math.random(), // Fallback random score for demo
        confidence: 0.1,
        prediction: 'unknown',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

class URLFeatureExtractor {
  constructor() {
    this.suspiciousWords = [
      'paypal', 'amazon', 'apple', 'microsoft', 'google', 'facebook',
      'bank', 'secure', 'verify', 'confirm', 'update', 'suspend',
      'login', 'signin', 'account', 'billing', 'payment'
    ];
  }

  async extractFeatures(url, requiredFeatures) {
    const urlObj = new URL(url);
    const features = {};

    // Basic URL features
    features.url_length = url.length;
    features.num_dots = (url.match(/\./g) || []).length;
    features.num_subdomains = urlObj.hostname.split('.').length - 2;
    features.has_https = urlObj.protocol === 'https:' ? 1 : 0;
    features.domain_age = this.estimateDomainAge(urlObj.hostname);
    features.url_entropy = this.calculateEntropy(url);
    features.tld_type = this.getTLDType(urlObj.hostname);
    features.subdomain_count = urlObj.hostname.split('.').length - 2;
    features.path_depth = urlObj.pathname.split('/').length - 1;
    
    // Suspicious indicators
    features.suspicious_words = this.countSuspiciousWords(url);
    features.ip_address = this.isIPAddress(urlObj.hostname) ? 1 : 0;
    features.shortening_service = this.isURLShortener(urlObj.hostname) ? 1 : 0;
    features.prefix_suffix = this.hasPrefixSuffix(urlObj.hostname) ? 1 : 0;
    features.having_sub_domain = features.num_subdomains > 0 ? 1 : 0;

    // Advanced features
    features.url_features = this.getURLFeatureVector(url);
    features.domain_features = this.getDomainFeatureVector(urlObj.hostname);
    features.page_features = await this.getPageFeatures(url);
    features.whois_features = this.getWhoisFeatures(urlObj.hostname);
    features.lexical_features = this.getLexicalFeatures(url);
    features.host_features = this.getHostFeatures(urlObj.hostname);
    features.content_features = await this.getContentFeatures(url);
    features.statistical_features = this.getStatisticalFeatures(url);
    features.structural_features = this.getStructuralFeatures(url);
    features.behavioral_features = this.getBehavioralFeatures(url);
    features.url_analysis = this.analyzeURL(url);
    features.domain_analysis = this.analyzeDomain(urlObj.hostname);
    features.content_analysis = await this.analyzeContent(url);
    features.network_analysis = this.analyzeNetwork(urlObj.hostname);

    // Return only requested features as array
    const featureArray = requiredFeatures.map(feature => {
      if (Array.isArray(features[feature])) {
        return features[feature];
      }
      return typeof features[feature] === 'number' ? features[feature] : 0;
    }).flat();

    // Pad or truncate to ensure consistent input size (10 features for demo)
    while (featureArray.length < 10) {
      featureArray.push(0);
    }
    
    return featureArray.slice(0, 10);
  }

  calculateEntropy(str) {
    const frequencies = {};
    for (let char of str) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }
    
    let entropy = 0;
    const length = str.length;
    
    for (let freq of Object.values(frequencies)) {
      const probability = freq / length;
      entropy -= probability * Math.log2(probability);
    }
    
    return entropy;
  }

  estimateDomainAge(hostname) {
    // Simple heuristic - in real implementation, use WHOIS data
    const tlds = ['.com', '.org', '.net', '.edu', '.gov'];
    const hasTrustedTLD = tlds.some(tld => hostname.endsWith(tld));
    return hasTrustedTLD ? Math.random() * 10 + 5 : Math.random() * 2;
  }

  getTLDType(hostname) {
    const parts = hostname.split('.');
    const tld = parts[parts.length - 1];
    
    const trustedTLDs = ['com', 'org', 'net', 'edu', 'gov'];
    const suspiciousTLDs = ['tk', 'ml', 'ga', 'cf'];
    
    if (trustedTLDs.includes(tld)) return 1;
    if (suspiciousTLDs.includes(tld)) return -1;
    return 0;
  }

  countSuspiciousWords(url) {
    const lowerUrl = url.toLowerCase();
    return this.suspiciousWords.reduce((count, word) => {
      return count + (lowerUrl.includes(word) ? 1 : 0);
    }, 0);
  }

  isIPAddress(hostname) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(hostname);
  }

  isURLShortener(hostname) {
    const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'short.link'];
    return shorteners.includes(hostname);
  }

  hasPrefixSuffix(hostname) {
    return hostname.includes('-') && hostname.split('-').length > 2;
  }

  getURLFeatureVector(url) {
    return [
      url.length / 100, // Normalized URL length
      (url.match(/[0-9]/g) || []).length / url.length, // Digit ratio
      (url.match(/[A-Z]/g) || []).length / url.length, // Uppercase ratio
      (url.match(/[!@#$%^&*()]/g) || []).length // Special chars
    ];
  }

  getDomainFeatureVector(hostname) {
    return [
      hostname.length,
      hostname.split('.').length,
      this.calculateEntropy(hostname),
      this.isIPAddress(hostname) ? 1 : 0
    ];
  }

  async getPageFeatures(url) {
    // In a real implementation, this would analyze page content
    return [Math.random(), Math.random(), Math.random()];
  }

  getWhoisFeatures(hostname) {
    // Placeholder for WHOIS-based features
    return [Math.random(), Math.random()];
  }

  getLexicalFeatures(url) {
    return [
      url.length,
      this.calculateEntropy(url),
      this.countSuspiciousWords(url),
      (url.match(/[0-9]/g) || []).length
    ];
  }

  getHostFeatures(hostname) {
    return [
      hostname.length,
      hostname.split('.').length,
      this.isIPAddress(hostname) ? 1 : 0,
      this.isURLShortener(hostname) ? 1 : 0
    ];
  }

  async getContentFeatures(url) {
    // Placeholder for content-based features
    return [Math.random(), Math.random(), Math.random()];
  }

  getStatisticalFeatures(url) {
    return [
      url.length,
      this.calculateEntropy(url),
      (url.match(/[a-z]/g) || []).length / url.length,
      (url.match(/[A-Z]/g) || []).length / url.length
    ];
  }

  getStructuralFeatures(url) {
    const urlObj = new URL(url);
    return [
      urlObj.pathname.split('/').length,
      urlObj.search.length,
      urlObj.hash.length,
      (url.match(/[&=?]/g) || []).length
    ];
  }

  getBehavioralFeatures(url) {
    // Placeholder for behavioral analysis
    return [Math.random(), Math.random()];
  }

  analyzeURL(url) {
    return [
      url.length / 100,
      this.calculateEntropy(url) / 10,
      this.countSuspiciousWords(url) / 5
    ];
  }

  analyzeDomain(hostname) {
    return [
      hostname.length / 50,
      hostname.split('.').length / 5,
      this.isIPAddress(hostname) ? 1 : 0
    ];
  }

  async analyzeContent(url) {
    // Placeholder for content analysis
    return [Math.random(), Math.random(), Math.random()];
  }

  analyzeNetwork(hostname) {
    return [
      this.isIPAddress(hostname) ? 1 : 0,
      this.isURLShortener(hostname) ? 1 : 0
    ];
  }
}
