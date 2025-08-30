# Phishing Detector - Chrome Extension

Protect yourself from phishing websites in real-time using advanced AI models and threat intelligence sources.

---

## 🚀 Quick Start

1. **Download**
   - Visit the [Releases](https://github.com/jrdevadattan/phishing-detector-extension/releases) page.
   - Download the latest `phishing-detector-extension.tar.gz`.

2. **Install in Chrome**
   - Extract the archive.
   - Open Chrome and go to `chrome://extensions/`.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the extracted folder.

3. **Configure (Optional)**
   - Click the extension icon in Chrome.
   - Open settings (gear icon).
   - Add your Google Safe Browsing and VirusTotal API keys for enhanced protection.

---

## 🛡️ Features

- Real-time URL analysis
- 7 integrated AI phishing detection models
- External threat intelligence (Google Safe Browsing, VirusTotal)
- Local AI inference for privacy
- Configurable risk threshold and notifications
- Easy-to-use interface

---

## 🎯 Usage

- Browsing is automatically protected.
- Extension badge shows risk level:
  - 🟢 Safe
  - 🟡 Suspicious
  - 🔴 Phishing
- Click the extension icon for detailed analysis or to re-scan the page.

---

## ⚙️ Settings

- Enable/disable models and services
- Set risk threshold (default: 70%)
- Configure notifications and auto-blocking

---

## 🐛 Troubleshooting

- Ensure the extension is enabled and permissions are granted.
- Check API keys if external services fail.
- Reduce enabled models for better performance.
- For help, open an issue on [GitHub](https://github.com/jrdevadattan/phishing-detector-extension/issues).

---

## 📁 Folder Structure

```
phishing-detector-extension/
├── background.js
├── content.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/
│   ├── options.html
│   ├── options.js
│   └── options.css
├── models/
│   └── [AI model files]
├── assets/
│   └── [icons, images]
├── manifest.json
├── README.md
└── ...
```

---

## 👨‍💻 Developer Guide

- **Clone the repo:**  
  `git clone https://github.com/jrdevadattan/phishing-detector-extension.git`
- **Install dependencies:**  
  See documentation for model requirements.
- **Load the extension:**  
  Use "Load unpacked" in Chrome (`chrome://extensions/`).
- **Make changes:**  
  Edit code, reload the extension to test.
- **Contribute:**  
  Pull requests and issues are welcome!

---

## 📖 Credits

### Datasets & Models Used

- [Grega Vrbancic Phishing Dataset](https://data.mendeley.com/datasets/h3cgnj8hft/1)
- [Kaggle Web Page Phishing Detection Dataset](https://www.kaggle.com/datasets/akashkr/phishing-website-detection)
- [Mendeley Phishing Dataset](https://data.mendeley.com/datasets/h3cgnj8hft/1)
- [HuggingFace Phishing Dataset](https://huggingface.co/datasets/phishing)
- [IEEE Dataport Phishing Attack Dataset](https://ieee-dataport.org/open-access/phishing-attack-dataset)
- [PhishOFE Dataset](https://zenodo.org/record/3724058)
- [Zenodo Phishing Dataset](https://zenodo.org/record/3724058)

### APIs and Services

- [Google Safe Browsing API](https://developers.google.com/safe-browsing/)
- [VirusTotal API](https://www.virustotal.com/gui/join-us)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)

---

**Disclaimer**: No security solution is 100% accurate. Always exercise