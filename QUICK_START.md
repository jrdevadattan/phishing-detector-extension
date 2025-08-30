# Quick Start Guide - Phishing Detector Pro

## 🚀 Get Started in 5 Minutes

### Step 1: Install the Extension

#### For Developers:
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked" and select the extension folder
5. ✅ Extension installed!

#### For End Users:
1. Visit Chrome Web Store (when published)
2. Search for "Phishing Detector Pro"
3. Click "Add to Chrome"
4. ✅ Extension installed!

### Step 2: Basic Setup (2 minutes)

1. **Click the extension icon** (🛡️) in your Chrome toolbar
2. **Click the gear icon** (⚙️) to open settings
3. **Configure basic settings**:
   - ✅ Keep "Enable Phishing Detection" ON
   - ✅ Keep "Show Notifications" ON
   - ⚡ Set risk threshold to **70%** (recommended)
4. **Save settings**

### Step 3: Add API Keys (Optional - 3 minutes)

For enhanced protection, add free API keys:

#### Google Safe Browsing (Recommended):
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a project → Enable Safe Browsing API → Create API Key
3. Copy the key to **Settings → API Keys → Google Safe Browsing**

#### VirusTotal (Recommended):
1. Go to [VirusTotal](https://www.virustotal.com/gui/join-us)
2. Create free account → Go to profile → Copy API key  
3. Paste in **Settings → API Keys → VirusTotal**

### Step 4: Test the Extension

1. **Visit any website** - the extension automatically analyzes it
2. **Check the badge** on the extension icon:
   - 🟢 **SAFE** = Low risk (0-29%)
   - 🟡 **MED** = Medium risk (30-69%)
   - 🔴 **HIGH** = High risk (70-100%)
3. **Click the extension icon** to see detailed results

## 🎯 How It Works

### Automatic Protection
- 🔍 **Scans every website** you visit in real-time
- 🤖 **7 AI models** analyze URL patterns and features
- 🌐 **External APIs** check against threat databases
- 🧠 **Ensemble engine** combines all results
- ⚡ **Instant feedback** via badge and notifications

### What You'll See

#### Safe Website:
- Badge: 🟢 SAFE
- Risk: 5-15%
- Action: Browse normally

#### Suspicious Website:
- Badge: 🟡 MED  
- Risk: 30-69%
- Action: Exercise caution

#### Phishing Website:
- Badge: 🔴 HIGH
- Risk: 70-100%
- Action: Avoid or auto-blocked

## ⚙️ Quick Settings

### Essential Settings
| Setting | Recommendation | Why |
|---------|----------------|-----|
| **Risk Threshold** | 70% | Good balance of security vs false positives |
| **Show Notifications** | ON | Get alerted to dangerous sites |
| **Auto-block** | OFF initially | Test first, then enable for maximum security |
| **AI Models** | All ON | More models = better accuracy |
| **Trust Scores** | ON | External validation improves accuracy |

### Performance vs Security Trade-offs

**For Maximum Security:**
- Enable all AI models
- Enable all trust score services  
- Set threshold to 50%
- Enable auto-blocking
- Enable notifications

**For Better Performance:**
- Enable 3-4 top AI models only
- Set threshold to 80%
- Increase cache expiry to 120 minutes
- Disable detailed logging

## 🔧 Quick Troubleshooting

### Extension Not Working?
1. ✅ Check it's enabled in `chrome://extensions/`
2. 🔄 Try disabling and re-enabling
3. 🌐 Ensure internet connection for API services

### Getting Errors?
1. 🔑 Verify API keys are entered correctly
2. 📊 Check if you've hit daily API limits (reset at midnight)
3. 🧹 Try clearing the cache in settings

### Too Many False Positives?
1. 📈 Increase risk threshold to 80-90%
2. 🎯 Disable overly sensitive models
3. 📝 Report false positives using the "Report Issue" button

## 📱 Daily Usage

### Normal Browsing
- Extension works silently in the background
- Check the badge color for quick risk assessment
- Click icon for detailed analysis when curious

### When You See a Warning
1. **🟡 Medium Risk**: Be cautious, avoid entering sensitive info
2. **🔴 High Risk**: Don't enter passwords, credit cards, or personal data
3. **🚫 Auto-blocked**: Site was automatically blocked for your safety

### Popup Information
- **Risk %**: Overall threat assessment
- **Confidence**: How sure the system is
- **AI Models**: Individual model scores
- **Trust Scores**: External service results
- **Factors**: Why the site was flagged

## 💡 Pro Tips

1. **🔄 Refresh Analysis**: If you disagree with a result, try refreshing
2. **📊 Check Details**: Click "Show Detailed Results" for transparency  
3. **⚙️ Customize**: Adjust settings based on your security needs
4. **📝 Report Issues**: Help improve the system by reporting problems
5. **🔑 Keep Keys Updated**: Monitor API usage and renew keys as needed

## 🆘 Need Help?

### In the Extension:
- Click **"Help"** in the popup for quick info
- Use **"Report Issue"** to contact support
- Check **settings** for configuration options

### Documentation:
- 📖 **README.md** - Complete technical documentation
- 🔧 **SETUP.md** - Detailed setup instructions
- 🐛 **GitHub Issues** - Report bugs and request features

### Contact:
- 📧 Email: support@phishingdetector.com
- 💬 GitHub: Create an issue for bugs/features

---

**🎉 You're all set!** The extension is now protecting you from phishing threats in real-time. Browse safely! 🛡️
