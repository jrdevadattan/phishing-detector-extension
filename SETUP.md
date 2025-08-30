# Setup Instructions - Phishing Detector Pro

## 📋 Prerequisites

- Google Chrome browser (version 88 or higher)
- Internet connection (for API services)
- Optional: API keys for external services

## 🛠️ Development Setup

### 1. Download Dependencies

```bash
# Navigate to the extension directory
cd phishing-detector-extension

# Install npm dependencies
npm install

# Prepare assets (copy TensorFlow.js)
npm run build
```

### 2. Prepare AI Models

Since the actual AI models are large files, you'll need to:

1. **Download or train your models** based on the datasets mentioned
2. **Convert models to TensorFlow.js format**:
   ```bash
   # Example for converting a Keras model
   tensorflowjs_converter --input_format=keras \
     --output_format=tfjs_layers_model \
     path/to/your/model.h5 \
     models/model_name/
   ```
3. **Place model files** in the respective directories:
   - `models/vrbancic/model.json`
   - `models/kaggle/model.json`
   - `models/mendeley/model.json`
   - `models/huggingface/model.json`
   - `models/ieee/model.json`
   - `models/phishofe/model.json`
   - `models/zenodo/model.json`

### 3. Add Extension Icons

Create or add icon files in the `icons/` directory:
- `icon16.png` (16x16 pixels)
- `icon32.png` (32x32 pixels)  
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can create simple placeholder icons or design custom ones for your extension.

### 4. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" toggle in the top right
3. Click "Load unpacked" button
4. Select the `phishing-detector-extension` directory
5. The extension should now appear in your extensions list

## ⚙️ Configuration

### 1. Basic Configuration

1. **Click the extension icon** in the Chrome toolbar
2. **Click the settings gear** to open the configuration page
3. **Configure general settings**:
   - Enable/disable the extension
   - Set risk threshold (recommended: 70%)
   - Choose notification preferences
   - Configure auto-blocking behavior

### 2. API Keys Setup (Recommended)

#### Google Safe Browsing API

1. **Go to Google Cloud Console**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Safe Browsing API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Safe Browsing API"
   - Click "Enable"

3. **Create API Key**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

4. **Configure in Extension**:
   - Open extension settings
   - Go to "API Keys" tab
   - Paste the Google Safe Browsing API key
   - Save settings

#### VirusTotal API

1. **Create VirusTotal Account**:
   - Visit [VirusTotal](https://www.virustotal.com/gui/join-us)
   - Create a free account

2. **Get API Key**:
   - Log in to your account
   - Go to your profile/settings
   - Copy your API key

3. **Configure in Extension**:
   - Open extension settings  
   - Go to "API Keys" tab
   - Paste the VirusTotal API key
   - Save settings

### 3. AI Models Configuration

1. **Enable/Disable Models**:
   - Go to "AI Models" tab in settings
   - Toggle individual models on/off
   - More models = better accuracy but slower performance

2. **Model-specific Settings**:
   - Each model can be individually enabled/disabled
   - The extension will work with any combination of models
   - At least one model should be enabled for AI-based detection

### 4. Trust Score Services

1. **Configure External Services**:
   - Go to "Trust Scores" tab
   - Enable/disable individual services
   - Services without API keys will use free/limited access

## 🧪 Testing the Extension

### 1. Test with Safe Sites

1. Visit known safe websites (e.g., google.com, github.com)
2. Check that the extension badge shows "SAFE" or low risk
3. Open the popup to see detailed analysis

### 2. Test with Suspicious Patterns

1. Visit sites with suspicious URLs (long, random domains)
2. Check if the extension properly flags them
3. Verify notifications work (if enabled)

### 3. Test Configuration

1. Change risk threshold settings
2. Disable/enable different models
3. Test API key validation
4. Verify cache clearing functionality

## 🔍 Validation Checklist

- [ ] Extension loads without errors in `chrome://extensions/`
- [ ] Popup opens and displays correctly
- [ ] Settings page accessible and functional
- [ ] Badge updates based on risk assessment
- [ ] Notifications work (if enabled)
- [ ] API keys can be entered and validated
- [ ] Cache can be cleared
- [ ] Settings can be exported/imported
- [ ] Warning page displays for high-risk sites (if auto-block enabled)
- [ ] No console errors in background page

## 📊 Performance Optimization

### Recommended Settings for Best Performance

```json
{
  "riskThreshold": 70,
  "cacheExpiry": 60,
  "performance": {
    "maxConcurrentChecks": 3,
    "timeoutMs": 10000,
    "retryAttempts": 2
  }
}
```

### For Slower Devices

- Disable some AI models (keep 2-3 most accurate ones)
- Increase cache expiry to 120 minutes
- Reduce max concurrent checks to 1
- Disable detailed logging

### For Maximum Security

- Enable all AI models
- Enable all trust score services
- Set risk threshold to 50%
- Enable auto-blocking
- Enable notifications

## 🐛 Troubleshooting

### Extension Won't Load

1. **Check manifest errors**:
   - Look for JSON syntax errors in `manifest.json`
   - Verify all referenced files exist
   - Check file permissions

2. **Verify dependencies**:
   ```bash
   npm install
   npm run build
   ```

3. **Check Chrome version**:
   - Requires Chrome 88+ for Manifest V3
   - Update Chrome if necessary

### Models Not Loading

1. **Check console errors**:
   - Open extension background page from `chrome://extensions/`
   - Look for TensorFlow.js errors in console

2. **Verify model files**:
   - Ensure model.json files exist in model directories
   - Check that model files are valid TensorFlow.js format

3. **Check web accessible resources**:
   - Verify models are listed in manifest.json web_accessible_resources

### API Errors

1. **Verify API keys**:
   - Check that keys are correctly entered
   - Ensure no extra spaces or characters

2. **Check rate limits**:
   - Free tier APIs have daily limits
   - Wait 24 hours if limits exceeded

3. **Network connectivity**:
   - Ensure internet connection is available
   - Check for corporate firewalls blocking API requests

## 📈 Monitoring and Analytics

### Built-in Monitoring

- Cache statistics available in settings
- API usage tracking (rate limits)
- Model performance indicators
- Error logging (when enabled)

### Custom Analytics

You can extend the extension to add:
- Custom event tracking
- Performance metrics
- User behavior analytics (with proper privacy considerations)

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks

1. **Update AI models** periodically with new training data
2. **Monitor API key status** and renew as needed
3. **Clear cache** regularly to ensure fresh results
4. **Update TensorFlow.js** for performance improvements
5. **Review settings** based on user feedback

### Version Updates

When updating the extension:
1. Increment version number in `manifest.json` and `package.json`
2. Test thoroughly with new changes
3. Update documentation as needed
4. Package and distribute new version

## 💡 Tips for Best Results

1. **Keep API keys current** - Monitor usage limits and renew keys
2. **Regular cache clearing** - Clear cache weekly for best performance  
3. **Monitor model performance** - Disable underperforming models
4. **Adjust threshold based on usage** - Lower threshold for high-security needs
5. **Keep extension updated** - Install updates for latest protection
6. **Report false positives** - Help improve the system accuracy

## 🎯 Next Steps

After successful setup:

1. Use the extension for several days to gather performance data
2. Adjust settings based on your browsing patterns
3. Consider contributing to the project with improvements
4. Share feedback and report any issues
5. Help others by sharing setup knowledge

For additional support, consult the main README.md file or contact support.
