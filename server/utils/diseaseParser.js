const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * CSV Disease Data Parser
 * Parses the Simplified_Disease_Summaries CSV file and provides search functionality
 */
class DiseaseDataParser {
  constructor() {
    this.diseases = [];
    this.isLoaded = false;
  }

  /**
   * Load and parse the CSV file
   */
  async loadData() {
    return new Promise((resolve, reject) => {
      const csvPath = path.join(__dirname, '../data/Simplified_Disease_Summaries (1).csv');
      const diseases = [];

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Clean and structure the data
          const disease = {
            name: row.Disease?.trim() || '',
            overview: row['What is it?']?.trim() || '',
            symptoms: this.parseSymptoms(row.Symptoms || ''),
            cause: row.Cause?.trim() || '',
            prevention: row.Prevention?.trim() || '',
            treatment: row.Treatment?.trim() || '',
            importance: row['Why it matters']?.trim() || '',
            // Extract symptom keywords for search
            symptomKeywords: this.extractSymptomKeywords(row.Symptoms || ''),
            // Calculate risk score based on severity indicators
            riskScore: this.calculateRiskScore(row),
            // Extract prevention methods
            preventionMethods: this.extractPreventionMethods(row.Prevention || '')
          };

          if (disease.name) {
            diseases.push(disease);
          }
        })
        .on('end', () => {
          this.diseases = diseases;
          this.isLoaded = true;
          console.log(`✅ Loaded ${diseases.length} diseases from CSV`);
          resolve(diseases);
        })
        .on('error', (error) => {
          console.error('❌ Error loading CSV:', error);
          reject(error);
        });
    });
  }

  /**
   * Parse symptoms from text into structured array
   */
  parseSymptoms(symptomsText) {
    if (!symptomsText || symptomsText.trim() === '') return [];
    
    // Common symptom indicators
    const symptomPatterns = [
      /symptoms?\s*include[:\s]*/i,
      /signs?\s*and\s*symptoms?[:\s]*/i,
      /may\s*experience[:\s]*/i,
      /characterized\s*by[:\s]*/i
    ];

    let cleanText = symptomsText;
    
    // Remove common prefixes
    symptomPatterns.forEach(pattern => {
      cleanText = cleanText.replace(pattern, '');
    });

    // Split by common delimiters
    const symptoms = cleanText
      .split(/[;,.]/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && s.length < 100)
      .map(s => s.replace(/^(and\s+|or\s+)/i, ''))
      .filter(s => s.length > 0);

    return symptoms.slice(0, 10); // Limit to 10 symptoms
  }

  /**
   * Extract keywords from symptoms for better search
   */
  extractSymptomKeywords(symptomsText) {
    const commonSymptoms = [
      'fever', 'pain', 'fatigue', 'nausea', 'vomiting', 'headache', 'cough',
      'shortness of breath', 'dizziness', 'weakness', 'swelling', 'rash',
      'bleeding', 'infection', 'inflammation', 'difficulty breathing',
      'chest pain', 'abdominal pain', 'diarrhea', 'constipation', 'loss of appetite'
    ];

    const keywords = [];
    const lowerText = symptomsText.toLowerCase();

    commonSymptoms.forEach(symptom => {
      if (lowerText.includes(symptom)) {
        keywords.push(symptom);
      }
    });

    return keywords;
  }

  /**
   * Calculate risk score based on content analysis
   */
  calculateRiskScore(row) {
    let score = 1; // Base score

    const highRiskIndicators = [
      'death', 'mortality', 'fatal', 'severe', 'critical', 'emergency',
      'life-threatening', 'complications', 'hospitalization'
    ];

    const mediumRiskIndicators = [
      'chronic', 'persistent', 'recurring', 'treatment', 'medication'
    ];

    const allText = `${row.Cause} ${row.Treatment} ${row['Why it matters']}`.toLowerCase();

    // Check for high risk indicators
    highRiskIndicators.forEach(indicator => {
      if (allText.includes(indicator)) score += 2;
    });

    // Check for medium risk indicators
    mediumRiskIndicators.forEach(indicator => {
      if (allText.includes(indicator)) score += 1;
    });

    // Normalize to 1-10 scale
    return Math.min(Math.max(score, 1), 10);
  }

  /**
   * Extract prevention methods into categories
   */
  extractPreventionMethods(preventionText) {
    const methods = {
      lifestyle: [],
      medical: [],
      environmental: [],
      behavioral: []
    };

    if (!preventionText) return methods;

    const lowerText = preventionText.toLowerCase();

    // Lifestyle prevention keywords
    const lifestyleKeywords = ['diet', 'exercise', 'nutrition', 'sleep', 'stress', 'weight'];
    lifestyleKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        methods.lifestyle.push(keyword);
      }
    });

    // Medical prevention keywords
    const medicalKeywords = ['vaccination', 'screening', 'treatment', 'medication', 'therapy'];
    medicalKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        methods.medical.push(keyword);
      }
    });

    // Environmental prevention keywords
    const environmentalKeywords = ['hygiene', 'sanitation', 'clean', 'safe', 'avoid'];
    environmentalKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        methods.environmental.push(keyword);
      }
    });

    // Behavioral prevention keywords
    const behavioralKeywords = ['avoid', 'stop', 'reduce', 'limit', 'prevent'];
    behavioralKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        methods.behavioral.push(keyword);
      }
    });

    return methods;
  }

  /**
   * Search diseases by name, symptoms, or keywords
   */
  searchDiseases(query, options = {}) {
    if (!this.isLoaded) {
      throw new Error('Disease data not loaded. Call loadData() first.');
    }

    const {
      limit = 10,
      includeChartData = false,
      sortBy = 'relevance'
    } = options;

    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return [];

    // Search algorithm
    const results = this.diseases.map(disease => {
      let relevanceScore = 0;

      // Exact name match (highest priority)
      if (disease.name.toLowerCase().includes(searchTerm)) {
        relevanceScore += 100;
      }

      // Symptom keyword matches
      disease.symptomKeywords.forEach(keyword => {
        if (keyword.includes(searchTerm) || searchTerm.includes(keyword)) {
          relevanceScore += 50;
        }
      });

      // Symptom text matches
      disease.symptoms.forEach(symptom => {
        if (symptom.toLowerCase().includes(searchTerm)) {
          relevanceScore += 30;
        }
      });

      // Cause matches
      if (disease.cause.toLowerCase().includes(searchTerm)) {
        relevanceScore += 20;
      }

      // Overview matches
      if (disease.overview.toLowerCase().includes(searchTerm)) {
        relevanceScore += 10;
      }

      return {
        ...disease,
        relevanceScore,
        chartData: includeChartData ? this.generateChartData(disease) : null
      };
    })
    .filter(disease => disease.relevanceScore > 0)
    .sort((a, b) => {
      if (sortBy === 'relevance') {
        return b.relevanceScore - a.relevanceScore;
      } else if (sortBy === 'risk') {
        return b.riskScore - a.riskScore;
      }
      return 0;
    })
    .slice(0, limit);

    return results;
  }

  /**
   * Get disease by exact name
   */
  getDiseaseByName(name) {
    if (!this.isLoaded) {
      throw new Error('Disease data not loaded. Call loadData() first.');
    }

    const disease = this.diseases.find(d => 
      d.name.toLowerCase() === name.toLowerCase()
    );

    if (!disease) return null;

    return {
      ...disease,
      chartData: this.generateChartData(disease)
    };
  }

  /**
   * Generate chart data for symptoms and risk visualization
   */
  generateChartData(disease) {
    // Symptom frequency chart data
    const symptomChart = {
      type: 'bar',
      title: 'Common Symptoms',
      data: disease.symptoms.slice(0, 6).map((symptom, index) => ({
        label: symptom.length > 20 ? symptom.substring(0, 20) + '...' : symptom,
        value: Math.max(95 - (index * 10), 30), // Simulated frequency
        color: `hsl(${200 + index * 30}, 70%, 50%)`
      }))
    };

    // Risk assessment chart
    const riskChart = {
      type: 'doughnut',
      title: 'Risk Assessment',
      data: [
        {
          label: 'Risk Level',
          value: disease.riskScore * 10,
          color: disease.riskScore > 7 ? '#ef4444' : disease.riskScore > 4 ? '#f59e0b' : '#10b981'
        },
        {
          label: 'Safety Margin',
          value: (10 - disease.riskScore) * 10,
          color: '#e5e7eb'
        }
      ]
    };

    // Prevention methods chart
    const preventionChart = {
      type: 'radar',
      title: 'Prevention Categories',
      data: [
        { label: 'Lifestyle', value: disease.preventionMethods.lifestyle.length * 20 },
        { label: 'Medical', value: disease.preventionMethods.medical.length * 20 },
        { label: 'Environmental', value: disease.preventionMethods.environmental.length * 20 },
        { label: 'Behavioral', value: disease.preventionMethods.behavioral.length * 20 }
      ]
    };

    return {
      symptoms: symptomChart,
      risk: riskChart,
      prevention: preventionChart
    };
  }

  /**
   * Get disease statistics
   */
  getStatistics() {
    if (!this.isLoaded) return null;

    return {
      totalDiseases: this.diseases.length,
      avgRiskScore: this.diseases.reduce((sum, d) => sum + d.riskScore, 0) / this.diseases.length,
      topSymptoms: this.getTopSymptoms(),
      riskDistribution: this.getRiskDistribution()
    };
  }

  /**
   * Get most common symptoms across all diseases
   */
  getTopSymptoms() {
    const symptomCount = {};
    
    this.diseases.forEach(disease => {
      disease.symptomKeywords.forEach(symptom => {
        symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
      });
    });

    return Object.entries(symptomCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([symptom, count]) => ({ symptom, count }));
  }

  /**
   * Get risk score distribution
   */
  getRiskDistribution() {
    const distribution = { low: 0, medium: 0, high: 0 };
    
    this.diseases.forEach(disease => {
      if (disease.riskScore <= 3) distribution.low++;
      else if (disease.riskScore <= 7) distribution.medium++;
      else distribution.high++;
    });

    return distribution;
  }

  /**
   * Get all diseases from CSV data
   */
  getAllDiseases() {
    if (!this.isLoaded) {
      console.warn('Disease data not yet loaded. Call loadData() first.');
      return [];
    }
    return [...this.diseases]; // Return a copy to prevent mutation
  }

  /**
   * Find diseases by symptoms
   */
  findBySymptoms(symptomArray, options = {}) {
    if (!this.isLoaded || !Array.isArray(symptomArray)) {
      return [];
    }

    const { minMatches = 1, limit = 10 } = options;
    const results = [];

    this.diseases.forEach(disease => {
      let matchCount = 0;
      const matchedSymptoms = [];

      // Check symptom matches
      symptomArray.forEach(searchSymptom => {
        const normalizedSearch = searchSymptom.toLowerCase().trim();
        
        // Check in symptom keywords
        disease.symptomKeywords.forEach(symptom => {
          if (symptom.toLowerCase().includes(normalizedSearch)) {
            matchCount++;
            if (!matchedSymptoms.includes(symptom)) {
              matchedSymptoms.push(symptom);
            }
          }
        });

        // Check in raw symptoms array
        if (disease.symptoms) {
          disease.symptoms.forEach(symptom => {
            if (symptom.toLowerCase().includes(normalizedSearch)) {
              matchCount++;
              if (!matchedSymptoms.includes(symptom)) {
                matchedSymptoms.push(symptom);
              }
            }
          });
        }
      });

      if (matchCount >= minMatches) {
        results.push({
          ...disease,
          matchCount,
          matchedSymptoms,
          relevanceScore: (matchCount / symptomArray.length) * 100
        });
      }
    });

    // Sort by relevance (match count and relevance score)
    results.sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return b.relevanceScore - a.relevanceScore;
    });

    return results.slice(0, limit);
  }
}

module.exports = DiseaseDataParser;