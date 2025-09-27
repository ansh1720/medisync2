/**
 * News Controller
 * Handles health news and alerts
 */

const { validationResult } = require('express-validator');

/**
 * Get health news articles
 */
exports.getNews = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const { category, page = 1, limit = 20 } = req.query;

    // Mock news data - in real system would fetch from news API or database
    const mockNews = [
      {
        id: '1',
        title: 'New Breakthrough in Diabetes Treatment',
        summary: 'Researchers discover promising new approach to managing Type 2 diabetes...',
        content: 'Full article content here...',
        category: 'diabetes',
        author: 'Medical News Team',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        imageUrl: 'https://example.com/diabetes-news.jpg',
        source: 'Medical Journal',
        tags: ['diabetes', 'treatment', 'research']
      },
      {
        id: '2',
        title: 'Heart Health Guidelines Updated for 2024',
        summary: 'American Heart Association releases new recommendations...',
        content: 'Full article content here...',
        category: 'cardiology',
        author: 'Dr. Sarah Johnson',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        imageUrl: 'https://example.com/heart-health.jpg',
        source: 'American Heart Association',
        tags: ['heart', 'guidelines', 'prevention']
      },
      {
        id: '3',
        title: 'Mental Health Apps Show Promise in Clinical Trials',
        summary: 'Digital therapeutics demonstrate effectiveness in treating anxiety and depression...',
        content: 'Full article content here...',
        category: 'mental_health',
        author: 'Tech Health Reporter',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        imageUrl: 'https://example.com/mental-health-apps.jpg',
        source: 'Digital Health Today',
        tags: ['mental health', 'apps', 'digital therapeutics']
      }
    ];

    // Filter by category if provided
    let filteredNews = mockNews;
    if (category) {
      filteredNews = mockNews.filter(article => article.category === category);
    }

    // Simulate pagination
    const startIndex = (page - 1) * limit;
    const paginatedNews = filteredNews.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      data: {
        articles: paginatedNews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredNews.length,
          pages: Math.ceil(filteredNews.length / limit)
        },
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving news'
    });
  }
};

/**
 * Get health alerts and warnings
 */
exports.getAlerts = async (req, res) => {
  try {
    const { severity, region } = req.query;

    // Mock alert data - in real system would fetch from health authorities APIs
    const mockAlerts = [
      {
        id: 'alert-1',
        title: 'Flu Activity Increasing in Northern Regions',
        message: 'Health officials report increased flu activity. Get vaccinated and practice prevention measures.',
        severity: 'medium',
        category: 'infectious_disease',
        region: 'northern_states',
        issuedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        source: 'CDC',
        recommendations: [
          'Get annual flu vaccination',
          'Wash hands frequently',
          'Avoid close contact with sick individuals',
          'Stay home when feeling ill'
        ]
      },
      {
        id: 'alert-2',
        title: 'Air Quality Warning for Urban Areas',
        message: 'Poor air quality detected. Individuals with respiratory conditions should limit outdoor activities.',
        severity: 'high',
        category: 'environmental_health',
        region: 'urban_areas',
        issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        source: 'EPA',
        recommendations: [
          'Limit outdoor activities',
          'Use air purifiers indoors',
          'Wear N95 masks when outdoors',
          'Keep windows closed'
        ]
      }
    ];

    // Filter alerts
    let filteredAlerts = mockAlerts;
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    
    if (region) {
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.region === region || alert.region === 'all_regions'
      );
    }

    res.json({
      success: true,
      data: {
        alerts: filteredAlerts,
        summary: {
          total: filteredAlerts.length,
          critical: filteredAlerts.filter(a => a.severity === 'critical').length,
          high: filteredAlerts.filter(a => a.severity === 'high').length,
          medium: filteredAlerts.filter(a => a.severity === 'medium').length,
          low: filteredAlerts.filter(a => a.severity === 'low').length
        },
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving health alerts'
    });
  }
};

/**
 * Get available news categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      {
        id: 'general',
        name: 'General Health',
        description: 'General health news and updates'
      },
      {
        id: 'diabetes',
        name: 'Diabetes',
        description: 'Diabetes research, treatments, and management'
      },
      {
        id: 'cardiology',
        name: 'Heart Health',
        description: 'Cardiovascular health and heart disease news'
      },
      {
        id: 'mental_health',
        name: 'Mental Health',
        description: 'Mental health awareness and treatment updates'
      },
      {
        id: 'nutrition',
        name: 'Nutrition',
        description: 'Diet, nutrition, and healthy eating news'
      },
      {
        id: 'infectious_disease',
        name: 'Infectious Diseases',
        description: 'Updates on infectious diseases and prevention'
      },
      {
        id: 'technology',
        name: 'Health Technology',
        description: 'Medical technology and digital health innovations'
      },
      {
        id: 'policy',
        name: 'Health Policy',
        description: 'Healthcare policy and regulatory updates'
      }
    ];

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving news categories'
    });
  }
};

module.exports = exports;