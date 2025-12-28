/**
 * News Controller
 * Handles health news from trusted sources (WHO, CDC, PubMed)
 */

const { validationResult } = require('express-validator');
const axios = require('axios');
const xml2js = require('xml2js');

// Cache for news articles
let newsCache = {
  articles: [],
  lastFetch: null,
  cacheDuration: 10 * 60 * 1000 // 10 minutes
};

/**
 * Fetch news from WHO RSS feeds
 */
const fetchWHONews = async () => {
  try {
    const feeds = [
      'https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml',
      'https://www.who.int/feeds/entity/csr/don/en/rss.xml'
    ];
    
    const allArticles = [];
    
    for (const feedUrl of feeds) {
      try {
        const response = await axios.get(feedUrl, { timeout: 8000 });
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        
        if (result.rss && result.rss.channel && result.rss.channel[0].item) {
          const articles = result.rss.channel[0].item.slice(0, 15).map((item, index) => ({
            id: `who-${Date.now()}-${index}`,
            title: item.title[0],
            summary: item.description ? item.description[0].replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '',
            url: item.link[0],
            source: 'WHO',
            author: 'World Health Organization',
            publishedAt: new Date(item.pubDate[0]),
            tags: ['WHO', 'Global Health', 'Public Health'],
            category: 'health'
          }));
          allArticles.push(...articles);
        }
      } catch (err) {
        console.warn('WHO feed error:', err.message);
      }
    }
    
    return allArticles;
  } catch (error) {
    console.error('WHO fetch error:', error);
    return [];
  }
};

/**
 * Fetch news from CDC API
 */
const fetchCDCNews = async () => {
  try {
    const response = await axios.get('https://tools.cdc.gov/api/v2/resources/media', {
      timeout: 8000,
      params: {
        max: 20,
        sort: 'date desc'
      }
    });
    
    if (response.data && response.data.results) {
      return response.data.results.slice(0, 15).map((item, index) => ({
        id: `cdc-${Date.now()}-${index}`,
        title: item.name || item.title,
        summary: item.description ? item.description.substring(0, 200) + '...' : '',
        url: item.sourceUrl || item.url,
        source: 'CDC',
        author: 'Centers for Disease Control and Prevention',
        publishedAt: new Date(item.datePublished || item.publishDate),
        tags: ['CDC', 'Disease Control', 'Prevention'],
        category: 'health'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('CDC fetch error:', error);
    return [];
  }
};

/**
 * Fetch research from PubMed
 */
const fetchPubMedNews = async () => {
  try {
    // Search for recent health articles
    const searchResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
      timeout: 8000,
      params: {
        db: 'pubmed',
        term: 'health[Title] AND ("last 30 days"[PDat])',
        retmax: 15,
        retmode: 'json',
        sort: 'pub_date'
      }
    });
    
    if (searchResponse.data.esearchresult && searchResponse.data.esearchresult.idlist) {
      const ids = searchResponse.data.esearchresult.idlist;
      
      if (ids.length > 0) {
        // Fetch summaries
        const summaryResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', {
          timeout: 8000,
          params: {
            db: 'pubmed',
            id: ids.join(','),
            retmode: 'json'
          }
        });
        
        if (summaryResponse.data.result) {
          return ids.map((id, index) => {
            const article = summaryResponse.data.result[id];
            return {
              id: `pubmed-${id}`,
              title: article.title || 'Research Article',
              summary: article.title ? article.title.substring(0, 200) + '...' : 'Medical research article',
              url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
              source: 'PubMed',
              author: article.authors && article.authors[0] ? article.authors[0].name : 'Medical Researchers',
              publishedAt: new Date(article.pubdate || Date.now()),
              tags: ['PubMed', 'Research', 'Medical Study'],
              category: 'research'
            };
          });
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error('PubMed fetch error:', error);
    return [];
  }
};

/**
 * Get health news articles from trusted sources
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
    const now = Date.now();

    // Check if cache is valid
    const isCacheValid = newsCache.lastFetch && (now - newsCache.lastFetch) < newsCache.cacheDuration;

    // Fetch fresh news if cache is invalid or empty
    if (!isCacheValid || newsCache.articles.length === 0) {
      console.log('📰 Fetching fresh news from WHO, CDC, and PubMed...');
      
      // Fetch from all sources in parallel
      const [whoArticles, cdcArticles, pubmedArticles] = await Promise.all([
        fetchWHONews(),
        fetchCDCNews(),
        fetchPubMedNews()
      ]);

      // Combine and sort by date (newest first)
      newsCache.articles = [
        ...whoArticles,
        ...cdcArticles,
        ...pubmedArticles
      ].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      newsCache.lastFetch = now;

      console.log(`✅ Fetched ${newsCache.articles.length} articles (WHO: ${whoArticles.length}, CDC: ${cdcArticles.length}, PubMed: ${pubmedArticles.length})`);
    } else {
      console.log(`📦 Using cached news (${newsCache.articles.length} articles, age: ${Math.round((now - newsCache.lastFetch) / 1000)}s)`);
    }

    // Get articles from cache
    let allArticles = [...newsCache.articles];

    // Filter by category if provided
    if (category && category !== 'all') {
      allArticles = allArticles.filter(article => article.category === category);
    }

    // Paginate
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedArticles = allArticles.slice(startIndex, endIndex);
    const hasMore = endIndex < allArticles.length;

    res.json({
      success: true,
      data: {
        articles: paginatedArticles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: allArticles.length,
          pages: Math.ceil(allArticles.length / limitNum),
          hasMore
        },
        lastUpdated: new Date(newsCache.lastFetch)
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