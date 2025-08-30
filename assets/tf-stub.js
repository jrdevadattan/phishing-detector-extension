// Minimal TensorFlow.js stub for development testing
// This is a placeholder - in production, use the full TensorFlow.js library

window.tf = {
  // Mock tensor creation
  tensor2d: function(data) {
    return {
      data: function() {
        return Promise.resolve(new Float32Array([Math.random()]));
      },
      dispose: function() {
        // Mock cleanup
      }
    };
  },

  // Mock model loading
  loadLayersModel: function(url) {
    console.log('Mock loading model from:', url);
    return Promise.resolve({
      predict: function(inputTensor) {
        return {
          data: function() {
            return Promise.resolve(new Float32Array([Math.random()]));
          },
          dispose: function() {
            // Mock cleanup
          }
        };
      }
    });
  },

  // Mock sequential model
  sequential: function(config) {
    return {
      predict: function(inputTensor) {
        return {
          data: function() {
            return Promise.resolve(new Float32Array([Math.random()]));
          },
          dispose: function() {
            // Mock cleanup
          }
        };
      }
    };
  },

  // Mock layers
  layers: {
    dense: function(config) {
      return {};
    }
  }
};

console.log('TensorFlow.js stub loaded for development');
