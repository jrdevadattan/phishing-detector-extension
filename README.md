# Phishing Detector - Chrome Extension

A comprehensive Chrome Extension that detects phishing websites in real-time using multiple AI models and threat intelligence sources.

## 🛡️ Features

### Core Capabilities
- **Real-time URL Analysis**: Automatically scans every website you visit
- **Multiple AI Models**: Integrates 7 different phishing detection models trained on various datasets
- **Threat Intelligence**: Combines AI predictions with public trust score services
- **Ensemble Decision Engine**: Advanced algorithm that weighs multiple detection sources
- **Local Processing**: All AI inference runs locally for privacy
- **Intelligent Caching**: Optimized performance with smart result caching

### AI Models Integrated
1. **Grega Vrbancic Phishing Dataset Model** - URL feature-based detection
2. **Kaggle Web Page Phishing Dataset Model** - Machine learning classifier
3. **Mendeley Phishing Dataset Model** - Research-based detection
4. **HuggingFace Phishing Dataset Model** - Transformer-based analysis
5. **IEEE Dataport Phishing Attack Dataset Model** - Academic research model
6. **PhishOFE Dataset Model** - Comprehensive phishing detection framework
7. **Zenodo Phishing Dataset Model** - Open research model

### External Trust Score Services
- **Google Safe Browsing API** - Google's threat intelligence
- **VirusTotal API** - Multi-engine malware scanner
- **URLVoid** (Optional) - Website reputation checker
- **PhishTank** (Optional) - Community phishing database

## 📁 Project Structure

```
phishing-detector-extension/
├── manifest.json              # Extension manifest (Manifest V3)
├── package.json              # NPM dependencies and scripts
├── README.md                 # This documentation
├── background/
│   └── background.js         # Service worker for URL monitoring
├── src/
│   ├── ai-models.js         # AI model integration and feature extraction
│   ├── trust-scores.js      # External threat intelligence APIs
│   ├── ensemble-engine.js   # Decision fusion algorithm
│   ├── cache-manager.js     # Performance optimization
│   └── config-manager.js    # Settings management
├── popup/
│   ├── popup.html           # Extension popup interface
│   ├── popup.css            # Popup styling
│   └── popup.js             # Popup functionality
├── options/
│   ├── options.html         # Settings page
│   ├── options.css          # Settings page styling
│   └── options.js           # Settings page functionality
├── content/
│   └── content.js           # Content script for page monitoring
├── assets/
│   └── warning.html         # Warning page for blocked sites
├── icons/
│   ├── icon16.png           # Extension icons (various sizes)
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── models/                  # AI model files (to be added)
    ├── vrbancic/
    ├── kaggle/
    ├── mendeley/
    ├── huggingface/
    ├── ieee/
    ├── phishofe/
    └── zenodo/
```

## 🚀 Installation

### Development Setup

1. **Clone or Download** the extension files to your local machine

2. **Install Dependencies** (if you want to build from source):
   ```bash
   cd phishing-detector-extension
   npm install
   npm run build
   ```

3. **Load Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the extension directory
   - The extension should now appear in your toolbar

### Production Installation
(Once published to Chrome Web Store)
- Visit the Chrome Web Store
- Search for "Phishing Detector Pro"
- Click "Add to Chrome"

## ⚙️ Configuration

### Initial Setup

1. **Open Extension Settings**:
   - Click the extension icon in the toolbar
   - Click the gear (⚙️) icon to open settings

2. **Configure API Keys** (Optional but recommended):
   - Go to the "API Keys" tab
   - Add your Google Safe Browsing API key
   - Add your VirusTotal API key
   - Links to get free API keys are provided in the interface

3. **Adjust Settings**:
   - Set risk threshold (default: 70%)
   - Choose which AI models to enable
   - Configure notification preferences
   - Enable/disable auto-blocking

### API Key Setup

#### Google Safe Browsing API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Safe Browsing API"
4. Create credentials (API Key)
5. Restrict the API key to Safe Browsing API only
6. Copy the API key to the extension settings

#### VirusTotal API
1. Go to [VirusTotal](https://www.virustotal.com/gui/join-us)
2. Create a free account
3. Go to your profile settings
4. Copy your API key
5. Paste it in the extension settings

**Note**: Free tier limitations apply:
- Google Safe Browsing: 10,000 requests/day
- VirusTotal: 500 requests/day

## 🎯 Usage

### Automatic Protection
The extension works automatically once installed:
- **Real-time Scanning**: Every website is analyzed as you browse
- **Visual Indicators**: Extension badge shows risk level
- **Notifications**: Alerts for high-risk sites (if enabled)
- **Auto-blocking**: Dangerous sites can be automatically blocked

### Risk Levels
- 🟢 **SAFE (0-29%)**: Low risk, likely legitimate website
- 🟡 **SUSPICIOUS (30-69%)**: Medium risk, exercise caution
- 🔴 **PHISHING (70-100%)**: High risk, likely malicious website

### Manual Analysis
- Click the extension icon to see detailed analysis
- Use "Refresh Analysis" to re-scan current page
- View individual model scores and confidence levels

## 🔧 Technical Details

### Architecture
- **Manifest V3** compatible
- **Service Worker** for background processing
- **Content Scripts** for page monitoring
- **TensorFlow.js** for local AI model execution
- **Chrome Storage API** for settings and caching

### Privacy & Security
- **Local AI Processing**: All machine learning runs in your browser
- **Secure Storage**: API keys stored in Chrome's secure storage
- **No Data Collection**: No personal browsing data is transmitted
- **Open Source**: Full transparency in detection methods

### Performance Optimizations
- **Intelligent Caching**: Results cached for 1 hour by default
- **Concurrent Processing**: Multiple models run in parallel
- **Rate Limiting**: Respects API rate limits
- **Minimal Impact**: Optimized to not slow down browsing

## 🛠️ Development

### Adding New AI Models

1. **Prepare Model**:
   ```javascript
   // Convert your model to TensorFlow.js format
   tensorflowjs_converter --input_format=keras model.h5 models/new_model/
   ```

2. **Add Model Configuration**:
   ```javascript
   // In src/ai-models.js
   modelConfigs: {
     new_model: {
       name: 'New Model Name',
       path: 'models/new_model/model.json',
       features: ['feature1', 'feature2', 'feature3']
     }
   }
   ```

3. **Implement Prediction Method**:
   ```javascript
   async predictNewModel(url) {
     return this.predict('new_model', url);
   }
   ```

4. **Update Ensemble Weights**:
   ```javascript
   // In src/ensemble-engine.js
   modelWeights: {
     new_model: 0.1 // Adjust based on model performance
   }
   ```

### Adding New Trust Score Services

1. **Implement Service Class**:
   ```javascript
   // In src/trust-scores.js
   async getNewService(url) {
     // API integration code
   }
   ```

2. **Add Configuration Options**:
   ```javascript
   // Update UI and config files
   ```

3. **Update Ensemble Engine**:
   ```javascript
   // Add new service to weight configuration
   ```

### Testing

```bash
# Lint code
npm run lint

# Run tests (when implemented)
npm run test

# Package for distribution
npm run package
```

## 📖 API Reference

### Background Script Messages

```javascript
// Get analysis result for tab
chrome.runtime.sendMessage({
  action: 'getResult',
  tabId: tabId
});

// Force new analysis
chrome.runtime.sendMessage({
  action: 'forceAnalysis',
  url: url,
  tabId: tabId
});

// Update configuration
chrome.runtime.sendMessage({
  action: 'updateConfig',
  config: newConfig
});
```

### Configuration Schema

```javascript
{
  enabled: boolean,
  aiModelsEnabled: boolean,
  trustScoresEnabled: boolean,
  riskThreshold: number (0-100),
  showNotifications: boolean,
  autoBlock: boolean,
  cacheExpiry: number (minutes),
  models: {
    vrbancic: boolean,
    kaggle: boolean,
    mendeley: boolean,
    huggingface: boolean,
    ieee: boolean,
    phishofe: boolean,
    zenodo: boolean
  },
  trustSources: {
    googleSafeBrowsing: boolean,
    virusTotal: boolean,
    urlVoid: boolean,
    phishTank: boolean
  },
  ui: {
    showDetailedResults: boolean,
    showConfidenceScores: boolean,
    darkMode: boolean,
    compactView: boolean
  },
  logging: {
    enabled: boolean,
    logLevel: string ('debug'|'info'|'warn'|'error'),
    maxLogEntries: number
  },
  performance: {
    maxConcurrentChecks: number,
    timeoutMs: number,
    retryAttempts: number
  }
}
```

## 🔒 Security Considerations

### Data Privacy
- AI models run entirely in the browser
- No browsing data sent to external servers (except for API lookups)
- API keys stored securely in Chrome's encrypted storage
- Cache can be cleared at any time

### Rate Limiting
- Automatic rate limiting for external APIs
- Graceful degradation when APIs are unavailable
- Local fallback when external services fail

### False Positives
- Ensemble approach reduces false positive rate
- User can report false positives
- Configurable risk thresholds
- Manual override options available

## 🐛 Troubleshooting

### Common Issues

1. **Extension Not Working**:
   - Check if extension is enabled in Chrome settings
   - Verify permissions are granted
   - Try disabling and re-enabling the extension

2. **No AI Model Results**:
   - Check browser console for error messages
   - Ensure TensorFlow.js is loaded properly
   - Verify model files are accessible

3. **API Errors**:
   - Verify API keys are correctly entered
   - Check rate limit status
   - Ensure internet connection is available

4. **Performance Issues**:
   - Reduce number of enabled AI models
   - Increase cache expiry time
   - Disable detailed logging

### Debug Mode
Enable debug logging in Advanced settings to get detailed console output.

## 🤝 Contributing

### Reporting Issues
- Use the "Report Issue" button in the popup
- Include browser version and error details
- Provide example URLs (if safe to share)

### Contributing Code
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Datasets Used
- Grega Vrbancic Phishing Dataset
- Kaggle Web Page Phishing Detection Dataset
- Mendeley Phishing Dataset
- HuggingFace Phishing Dataset
- IEEE Dataport Phishing Attack Dataset
- PhishOFE Dataset
- Zenodo Phishing Dataset

### APIs and Services
- Google Safe Browsing API
- VirusTotal API
- TensorFlow.js
- Chrome Extensions API

## 📞 Support

For support, email support@phishingdetector.com or create an issue on GitHub.

## 🔄 Version History

### v1.0.0
- Initial release
- 7 AI models integration
- Google Safe Browsing and VirusTotal support
- Ensemble decision engine
- Full UI implementation
- Real-time detection
- Configurable settings

---

**⚠️ Disclaimer**: This extension is a security tool designed to help identify potential phishing websites. While it uses advanced AI models and threat intelligence, no security solution is 100% accurate. Always exercise caution when entering sensitive information online.
