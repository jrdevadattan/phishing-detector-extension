export class EnsembleDecisionEngine {
  constructor() {
    this.modelWeights = {
      vrbancic: 0.15,
      kaggle: 0.15,
      mendeley: 0.12,
      huggingface: 0.15,
      ieee: 0.13,
      phishofe: 0.15,
      zenodo: 0.15
    };
    
    this.trustScoreWeights = {
      googleSafeBrowsing: 0.4,
      virusTotal: 0.35,
      urlVoid: 0.15,
      phishTank: 0.1
    };
    
    // Overall weight distribution
    this.aiModelsWeight = 0.6;
    this.trustScoresWeight = 0.4;
  }

  generateDecision(aiModels, trustScores, config) {
    const aiResult = this.aggregateAIModels(aiModels, config);
    const trustResult = this.aggregateTrustScores(trustScores, config);
    const ensemble = this.combineResults(aiResult, trustResult, config);
    
    return {
      riskPercentage: Math.round(ensemble.score * 100),
      confidence: ensemble.confidence,
      recommendation: this.getRecommendation(ensemble.score, config),
      details: {
        aiModelsResult: aiResult,
        trustScoresResult: trustResult,
        ensembleScore: ensemble.score,
        ensembleConfidence: ensemble.confidence
      },
      breakdown: this.generateBreakdown(aiModels, trustScores, ensemble),
      timestamp: Date.now()
    };
  }

  aggregateAIModels(aiModels, config) {
    const validModels = Object.entries(aiModels).filter(([key, result]) => 
      result && typeof result.score === 'number' && !result.error && config.models[key]
    );
    
    if (validModels.length === 0) {
      return {
        score: 0.5,
        confidence: 0.1,
        modelsUsed: 0,
        details: {}
      };
    }

    let weightedSum = 0;
    let totalWeight = 0;
    let totalConfidence = 0;
    const modelDetails = {};

    validModels.forEach(([key, result]) => {
      const weight = this.modelWeights[key] || 0.1;
      const adjustedWeight = weight * (result.confidence || 0.5);
      
      weightedSum += result.score * adjustedWeight;
      totalWeight += adjustedWeight;
      totalConfidence += result.confidence || 0.5;
      
      modelDetails[key] = {
        score: result.score,
        confidence: result.confidence,
        prediction: result.prediction,
        weight: weight
      };
    });

    const aggregatedScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    const averageConfidence = totalConfidence / validModels.length;

    return {
      score: aggregatedScore,
      confidence: averageConfidence,
      modelsUsed: validModels.length,
      details: modelDetails
    };
  }

  aggregateTrustScores(trustScores, config) {
    const validScores = Object.entries(trustScores).filter(([key, result]) => 
      result && typeof result.score === 'number' && !result.error && config.trustSources[key]
    );
    
    if (validScores.length === 0) {
      return {
        score: 0.5,
        confidence: 0.1,
        servicesUsed: 0,
        details: {}
      };
    }

    let weightedSum = 0;
    let totalWeight = 0;
    let totalConfidence = 0;
    const serviceDetails = {};

    validScores.forEach(([key, result]) => {
      const weight = this.trustScoreWeights[key] || 0.1;
      const adjustedWeight = weight * (result.confidence || 0.5);
      
      weightedSum += result.score * adjustedWeight;
      totalWeight += adjustedWeight;
      totalConfidence += result.confidence || 0.5;
      
      serviceDetails[key] = {
        score: result.score,
        confidence: result.confidence,
        isSafe: result.isSafe,
        weight: weight
      };
    });

    const aggregatedScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    const averageConfidence = totalConfidence / validScores.length;

    return {
      score: aggregatedScore,
      confidence: averageConfidence,
      servicesUsed: validScores.length,
      details: serviceDetails
    };
  }

  combineResults(aiResult, trustResult, config) {
    // Adjust weights based on availability of data
    let aiWeight = this.aiModelsWeight;
    let trustWeight = this.trustScoresWeight;
    
    // If one source has no data, give full weight to the other
    if (aiResult.modelsUsed === 0 && trustResult.servicesUsed > 0) {
      aiWeight = 0;
      trustWeight = 1;
    } else if (trustResult.servicesUsed === 0 && aiResult.modelsUsed > 0) {
      aiWeight = 1;
      trustWeight = 0;
    } else if (aiResult.modelsUsed === 0 && trustResult.servicesUsed === 0) {
      // No data available - return neutral result
      return {
        score: 0.5,
        confidence: 0.1
      };
    }
    
    // Dynamic weight adjustment based on confidence
    const aiConfidenceWeight = aiResult.confidence || 0.5;
    const trustConfidenceWeight = trustResult.confidence || 0.5;
    const totalConfidenceWeight = aiConfidenceWeight + trustConfidenceWeight;
    
    if (totalConfidenceWeight > 0) {
      aiWeight *= aiConfidenceWeight / totalConfidenceWeight;
      trustWeight *= trustConfidenceWeight / totalConfidenceWeight;
    }

    // Combine scores
    const combinedScore = (aiResult.score * aiWeight) + (trustResult.score * trustWeight);
    const combinedConfidence = Math.min(
      (aiResult.confidence * aiWeight + trustResult.confidence * trustWeight),
      0.95
    );

    // Apply ensemble boosting for extreme cases
    const boostedScore = this.applyEnsembleBoosting(combinedScore, aiResult, trustResult);
    
    return {
      score: Math.max(0, Math.min(1, boostedScore)),
      confidence: combinedConfidence
    };
  }

  applyEnsembleBoosting(baseScore, aiResult, trustResult) {
    // Boost confidence when multiple sources agree
    const aiHigh = aiResult.score > 0.7;
    const aiLow = aiResult.score < 0.3;
    const trustHigh = trustResult.score > 0.7;
    const trustLow = trustResult.score < 0.3;
    
    // Strong agreement on high risk
    if ((aiHigh && trustHigh) || (aiResult.modelsUsed >= 3 && aiResult.score > 0.8)) {
      return Math.min(1, baseScore * 1.2);
    }
    
    // Strong agreement on low risk
    if ((aiLow && trustLow) || (aiResult.modelsUsed >= 3 && aiResult.score < 0.2)) {
      return Math.max(0, baseScore * 0.8);
    }
    
    // Conflicting results - reduce confidence by staying closer to neutral
    if ((aiHigh && trustLow) || (aiLow && trustHigh)) {
      return 0.4 + (baseScore - 0.5) * 0.5;
    }
    
    return baseScore;
  }

  getRecommendation(score, config) {
    const riskThreshold = config.riskThreshold / 100;
    const suspiciousThreshold = Math.max(0.3, riskThreshold - 0.2);
    
    if (score >= riskThreshold) {
      return 'PHISHING';
    } else if (score >= suspiciousThreshold) {
      return 'SUSPICIOUS';
    } else {
      return 'SAFE';
    }
  }

  generateBreakdown(aiModels, trustScores, ensemble) {
    const breakdown = {
      summary: `Risk: ${Math.round(ensemble.score * 100)}% (${this.getRecommendation(ensemble.score, { riskThreshold: 70 })})`,
      aiModels: {},
      trustScores: {},
      factors: []
    };

    // AI Models breakdown
    Object.entries(aiModels).forEach(([key, result]) => {
      if (result && !result.error) {
        breakdown.aiModels[key] = {
          name: result.modelName,
          score: Math.round(result.score * 100) + '%',
          prediction: result.prediction,
          confidence: Math.round((result.confidence || 0) * 100) + '%'
        };
      }
    });

    // Trust Scores breakdown
    Object.entries(trustScores).forEach(([key, result]) => {
      if (result && !result.error) {
        breakdown.trustScores[key] = {
          service: result.service,
          score: Math.round(result.score * 100) + '%',
          confidence: Math.round((result.confidence || 0) * 100) + '%',
          safe: result.isSafe
        };
      }
    });

    // Risk factors
    if (ensemble.score > 0.7) {
      breakdown.factors.push('High risk detected by multiple models');
    }
    if (ensemble.score < 0.3) {
      breakdown.factors.push('Low risk confirmed by multiple sources');
    }
    if (ensemble.confidence < 0.5) {
      breakdown.factors.push('Limited confidence - conflicting results');
    }

    return breakdown;
  }

  // Advanced ensemble methods
  applyVotingEnsemble(predictions) {
    // Majority voting for binary classifications
    const votes = { phishing: 0, legitimate: 0 };
    
    Object.values(predictions).forEach(pred => {
      if (pred && pred.prediction) {
        votes[pred.prediction] = (votes[pred.prediction] || 0) + 1;
      }
    });
    
    return votes.phishing > votes.legitimate ? 'phishing' : 'legitimate';
  }

  applyStackingEnsemble(aiResults, trustResults) {
    // Simple stacking approach - in production, this would use a meta-learner
    const features = [];
    
    // Add AI model scores as features
    Object.values(aiResults).forEach(result => {
      if (result && typeof result.score === 'number') {
        features.push(result.score);
        features.push(result.confidence || 0.5);
      }
    });
    
    // Add trust scores as features
    Object.values(trustResults).forEach(result => {
      if (result && typeof result.score === 'number') {
        features.push(result.score);
        features.push(result.confidence || 0.5);
      }
    });
    
    // Simple weighted combination as meta-learner placeholder
    const avgScore = features.length > 0 ? 
      features.reduce((sum, score) => sum + score, 0) / features.length : 0.5;
    
    return {
      score: avgScore,
      confidence: Math.min(0.9, features.length * 0.1)
    };
  }
}
