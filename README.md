# 🛡️ Phishing Detector Pro

Protect yourself from phishing websites in real-time using advanced AI models and threat intelligence sources.

---

## 🚀 Quick Start

1. **Download**
   - Visit the [Releases](https://github.com/jrdevadattan/phishing-detector-extension/releases) page.
   - Download the latest `phishing-detector-extension.tar.gz` or `phishing-detector-extension.zip`.

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
## 📸 Screenshots

### Extension Popup
<img width="1917" height="1136" alt="image" src="https://github.com/user-attachments/assets/a6016df9-66a7-4472-8d67-00d9cb26a4c7" />

### Settings Page
<img width="1897" height="1026" alt="image" src="https://github.com/user-attachments/assets/0c845364-cfa3-4c26-b0ba-82226af76462" />

## 📖 Credits

### Datasets & Models Used

- [Phishing Dataset – GregaVrbancic](https://github.com/GregaVrbancic/Phishing-Dataset)
- [Web Page Phishing Detection Dataset – Kaggle](https://www.kaggle.com/datasets/shashwatwork/web-page-phishing-detection-dataset)
- [Phishing Dataset – Mendeley](https://data.mendeley.com/datasets/vfszbj9b36/1)
- [Phishing Dataset – Hugging Face](https://huggingface.co/datasets/ealvaradob/phishing-dataset)
- [Phishing Attack Dataset – IEEE DataPort](https://ieee-dataport.org/documents/phishing-attack-dataset)
- [PhishOfE Dataset – IEEE DataPort](https://ieee-dataport.org/documents/phishofe-dataset-phishing-url-dataset)
- [Phishing URL Dataset – Zenodo](https://zenodo.org/records/8041387)

### APIs and Services

- [Google Safe Browsing API](https://developers.google.com/safe-browsing/)
- [VirusTotal API](https://www.virustotal.com/gui/join-us)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)

---

**Disclaimer**: No security solution is 100% accurate. Always exercise
