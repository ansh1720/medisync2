// Advanced News Service with real APIs and infinite scroll support

const NEWS_API_SOURCES = {
  // Primary API - NewsAPI (requires API key)
  newsapi: {
    baseUrl: 'https://newsapi.org/v2',
    key: import.meta.env.VITE_NEWS_API_KEY || null,
    endpoint: '/everything'
  },
  
  // Fallback APIs for free tier
  gnews: {
    baseUrl: 'https://gnews.io/api/v4',
    key: import.meta.env.VITE_GNEWS_API_KEY || null,
    endpoint: '/search'
  },
  
  // Free news API (no key required)
  currentsapi: {
    baseUrl: 'https://api.currentsapi.services/v1',
    key: import.meta.env.VITE_CURRENTS_API_KEY || null,
    endpoint: '/search'
  },
  
  // WHO RSS Feeds - No key required
  who: {
    baseUrl: 'https://www.who.int',
    feeds: {
      news: '/feeds/entity/mediacentre/news/en/rss.xml',
      outbreak: '/feeds/entity/csr/don/en/rss.xml',
      emergencies: '/feeds/entity/emergencies/en/rss.xml'
    }
  },
  
  // CDC News API - No key required
  cdc: {
    baseUrl: 'https://tools.cdc.gov/api/v2/resources/media',
    topics: ['coronavirus', 'flu', 'vaccination', 'outbreak', 'prevention']
  },
  
  // PubMed API - Free, no key required
  pubmed: {
    baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
    searchEndpoint: '/esearch.fcgi',
    summaryEndpoint: '/esummary.fcgi'
  }
};

// Health-related keywords for better news filtering and diversity - HEALTH ONLY
const HEALTH_KEYWORDS = [
  // Core medical terms
  'health', 'medical', 'medicine', 'healthcare', 'hospital', 'doctor', 'disease',
  'treatment', 'therapy', 'clinical trial', 'vaccine', 'drug', 'pharmaceutical',
  'patient', 'diagnosis', 'symptoms', 'cure', 'surgery', 'medical device',
  
  // Diseases and conditions
  'cancer', 'diabetes', 'heart disease', 'stroke', 'alzheimer', 'dementia',
  'depression', 'anxiety', 'obesity', 'arthritis', 'asthma', 'tuberculosis',
  'malaria', 'HIV', 'AIDS', 'hepatitis', 'pneumonia', 'influenza',
  
  // Public health emergencies
  'outbreak', 'epidemic', 'pandemic', 'virus', 'bacteria', 'infection',
  'contagious', 'infectious disease', 'pathogen', 'quarantine', 'isolation',
  'health emergency', 'disease surveillance', 'contact tracing',
  
  // Health organizations
  'WHO', 'World Health Organization', 'CDC', 'Centers for Disease Control',
  'NIH', 'National Institutes of Health', 'FDA', 'Food and Drug Administration',
  'health ministry', 'health department', 'medical association',
  
  // Medical research and innovation
  'medical research', 'clinical study', 'drug trial', 'vaccine trial',
  'breakthrough', 'medical breakthrough', 'gene therapy', 'immunotherapy',
  'stem cell', 'biotech', 'biotechnology', 'precision medicine',
  
  // Healthcare systems and policy
  'public health', 'global health', 'health policy', 'healthcare reform',
  'health insurance', 'telemedicine', 'digital health', 'AI healthcare',
  'medical AI', 'health data', 'electronic health records'
];

// Diverse health news sources to avoid repetition
const PRIORITY_HEALTH_SOURCES = [
  // Official health organizations
  'who.int', 'cdc.gov', 'nih.gov', 'fda.gov', 'healthdata.org',
  // Medical journals and publications
  'nature.com', 'nejm.org', 'thelancet.com', 'bmj.com', 'jamanetwork.com',
  // Trusted health news websites
  'webmd.com', 'healthline.com', 'mayoclinic.org', 'medicalnewstoday.com',
  'clevelandclinic.org', 'hopkinsmedicine.org', 'health.harvard.edu',
  // International news with health coverage
  'reuters.com', 'bbc.com', 'cnn.com', 'apnews.com', 'npr.org',
  // Specialized health media
  'statnews.com', 'medscape.com', 'healio.com', 'fiercehealthcare.com',
  'modernhealthcare.com', 'healthcarefinancenews.com'
];

// News categories mapping
const CATEGORY_KEYWORDS = {
  breaking: ['breaking', 'urgent', 'alert', 'emergency', 'crisis'],
  research: ['research', 'study', 'clinical trial', 'breakthrough', 'discovery', 'findings'],
  prevention: ['prevention', 'vaccine', 'immunization', 'screening', 'awareness'],
  heart_health: ['heart', 'cardiac', 'cardiovascular', 'blood pressure', 'cholesterol'],
  mental_health: ['mental health', 'depression', 'anxiety', 'stress', 'therapy', 'psychology'],
  nutrition: ['nutrition', 'diet', 'food', 'vitamin', 'supplement', 'eating'],
  fitness: ['fitness', 'exercise', 'workout', 'physical activity', 'sports medicine'],
  technology: ['AI', 'technology', 'digital health', 'telemedicine', 'app', 'device'],
  policy: ['policy', 'healthcare system', 'insurance', 'legislation', 'government']
};

// Enhanced news fetching with multiple diverse sources to avoid repetition
// Import API base URL for backend fetching
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'ansh1720.github.io' 
    ? 'https://medisync-api-9043.onrender.com/api' 
    : 'http://localhost:5000/api');

// CACHE for all articles
let newsArticlesCache = {
  allArticles: [],
  lastFetch: null,
  cacheDuration: 10 * 60 * 1000 // 10 minutes
};

export const fetchHealthNews = async (options = {}) => {
  const {
    page = 1,
    pageSize = 20,
    category = 'all',
    searchQuery = '',
    sortBy = 'publishedAt',
    fromDate = null,
    language = 'en'
  } = options;

  const now = Date.now();
  const isCacheValid = newsArticlesCache.lastFetch && (now - newsArticlesCache.lastFetch) < newsArticlesCache.cacheDuration;

  // Fetch fresh articles if cache is invalid or empty
  if (!isCacheValid || newsArticlesCache.allArticles.length === 0) {
    console.log('📰 Fetching news from backend API...');
    
    try {
      // Fetch multiple pages from backend to build cache
      const pagesToFetch = 3; // Fetch 3 pages = ~60 articles
      const fetchPromises = [];
      
      for (let p = 1; p <= pagesToFetch; p++) {
        fetchPromises.push(
          axios.get(`${API_BASE_URL}/news`, {
            params: { page: p, limit: 20, category },
            timeout: 60000 // 60s for Render cold start
          })
        );
      }

      const results = await Promise.allSettled(fetchPromises);
      let allArticles = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data?.success) {
          const articles = result.value.data.data.articles || [];
          console.log(`✅ Backend page ${index + 1} succeeded: ${articles.length} articles`);
          allArticles.push(...articles);
        } else {
          console.warn(`⚠️ Backend page ${index + 1} failed:`, result.reason?.message || 'Unknown error');
        }
      });

      // Deduplicate by ID
      const uniqueArticles = [];
      const seenIds = new Set();
      allArticles.forEach(article => {
        if (!seenIds.has(article.id)) {
          seenIds.add(article.id);
          uniqueArticles.push(article);
        }
      });

      // Sort by date (newest first)
      uniqueArticles.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      });

      newsArticlesCache.allArticles = uniqueArticles;
      newsArticlesCache.lastFetch = now;
      
      console.log(`📦 Cached ${uniqueArticles.length} total articles from backend`);
    } catch (error) {
      console.error('❌ Backend news fetch failed:', error);
      // Return empty result if backend fails
      return {
        success: false,
        articles: [],
        totalResults: 0,
        hasMore: false,
        source: 'Backend API (failed)'
      };
    }
  } else {
    console.log(`📦 Using cached news (${newsArticlesCache.allArticles.length} articles, age: ${Math.round((now - newsArticlesCache.lastFetch) / 1000)}s)`);
  }

  // Get articles from cache
  let articles = [...newsArticlesCache.allArticles];

  // Apply search filter if provided
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    articles = articles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      (article.summary || article.description || '').toLowerCase().includes(query) ||
      (article.tags || []).some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Paginate
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedArticles = articles.slice(startIndex, endIndex);
  const hasMore = endIndex < articles.length;

  console.log(`📄 Page ${page}: Returning ${paginatedArticles.length} articles (${startIndex + 1}-${startIndex + paginatedArticles.length} of ${articles.length})`);

  return {
    success: true,
    articles: paginatedArticles,
    totalResults: articles.length,
    hasMore,
    source: 'Backend API (WHO, CDC, PubMed)'
  };
};

// Fetch from priority health sources (WHO, CDC, NIH, etc.)
const fetchFromPriorityHealthSources = async (options) => {
  const { page, pageSize, category, searchQuery } = options;
  
  // Check if we have a valid API key
  if (!NEWS_API_SOURCES.newsapi.key || NEWS_API_SOURCES.newsapi.key === 'demo') {
    throw new Error('No valid NewsAPI key for priority health sources');
  }
  
  // Build query focusing on official health organizations
  let query = buildOfficialHealthQuery(category, searchQuery);
  
  // Add priority source domains
  const domains = PRIORITY_HEALTH_SOURCES.slice(0, 10).join(' OR ');
  query += ` AND (${domains})`;
  
  const url = `${NEWS_API_SOURCES.newsapi.baseUrl}${NEWS_API_SOURCES.newsapi.endpoint}?` +
    `q=${encodeURIComponent(query)}&` +
    `domains=${PRIORITY_HEALTH_SOURCES.slice(0, 10).join(',')}&` +
    `page=${page}&` +
    `pageSize=${pageSize}&` +
    `sortBy=publishedAt&` +
    `language=en&` +
    `apiKey=${NEWS_API_SOURCES.newsapi.key}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Priority health sources failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();

  if (data.status === 'ok' && data.articles) {
    return {
      success: true,
      articles: data.articles.map(transformNewsAPIArticle),
      totalResults: data.totalResults,
      hasMore: data.articles.length === pageSize,
      source: 'Priority Health Sources (WHO, CDC, NIH, etc.)'
    };
  }

  throw new Error('Priority health sources failed');
};

// Fetch from international news sources with health focus
const fetchFromInternationalSources = async (options) => {
  const { page, pageSize, category, searchQuery } = options;
  
  // Check if we have a valid API key
  if (!NEWS_API_SOURCES.newsapi.key || NEWS_API_SOURCES.newsapi.key === 'demo') {
    throw new Error('No valid NewsAPI key for international sources');
  }
  
  const internationalSources = [
    'bbc.com', 'reuters.com', 'cnn.com', 'apnews.com', 'npr.org'
  ];
  
  let query = buildHealthQuery(category, searchQuery);
  
  const url = `${NEWS_API_SOURCES.newsapi.baseUrl}${NEWS_API_SOURCES.newsapi.endpoint}?` +
    `q=${encodeURIComponent(query)}&` +
    `domains=${internationalSources.join(',')}&` +
    `page=${page}&` +
    `pageSize=${pageSize}&` +
    `sortBy=publishedAt&` +
    `language=en&` +
    `apiKey=${NEWS_API_SOURCES.newsapi.key}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`International sources failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();

  if (data.status === 'ok' && data.articles) {
    return {
      success: true,
      articles: data.articles.map(transformNewsAPIArticle),
      totalResults: data.totalResults,
      hasMore: data.articles.length === pageSize,
      source: 'International News Sources'
    };
  }

  throw new Error('International sources failed');
};

// NewsAPI implementation
const fetchFromNewsAPI = async (options) => {
  const { page, pageSize, category, searchQuery } = options;
  
  // Check if we have a valid API key
  if (!NEWS_API_SOURCES.newsapi.key || NEWS_API_SOURCES.newsapi.key === 'demo') {
    throw new Error('No valid NewsAPI key');
  }
  
  let query = buildHealthQuery(category, searchQuery);
  
  // Request more articles to ensure we have enough after filtering
  const requestSize = Math.max(pageSize * 3, 60);
  
  const url = `${NEWS_API_SOURCES.newsapi.baseUrl}${NEWS_API_SOURCES.newsapi.endpoint}?` +
    `q=${encodeURIComponent(query)}&` +
    `page=${page}&` +
    `pageSize=${requestSize}&` +
    `sortBy=publishedAt&` +
    `language=en&` +
    `apiKey=${NEWS_API_SOURCES.newsapi.key}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.status === 'ok' && data.articles) {
    const transformedArticles = data.articles.map(transformNewsAPIArticle);
    const healthArticles = filterHealthArticles(transformedArticles);
    
    console.log('NewsAPI - Total received:', data.articles.length, 'Health articles after filter:', healthArticles.length);
    
    // If we got very few health articles, be more lenient
    if (healthArticles.length < 5 && transformedArticles.length > 0) {
      console.log('Very few health articles, using lenient filter');
      // Use all articles that at least mention health/medical in any way
      const lenientArticles = transformedArticles.filter(article => {
        const content = `${article.title} ${article.summary || ''}`.toLowerCase();
        return content.includes('health') || content.includes('medical') || 
               content.includes('disease') || content.includes('doctor') ||
               content.includes('hospital') || content.includes('patient');
      });
      
      if (lenientArticles.length > healthArticles.length) {
        console.log('Lenient filter found', lenientArticles.length, 'articles');
        const finalArticles = lenientArticles.slice(0, pageSize);
        return {
          success: true,
          articles: finalArticles,
          totalResults: lenientArticles.length,
          hasMore: lenientArticles.length > pageSize,
          source: 'NewsAPI'
        };
      }
    }
    
    // Return the requested page size, or all if less
    const finalArticles = healthArticles.slice(0, pageSize);
    
    // Only return if we have at least some health articles
    if (finalArticles.length === 0) {
      throw new Error('No health-related articles found');
    }
    
    return {
      success: true,
      articles: finalArticles,
      totalResults: healthArticles.length,
      hasMore: healthArticles.length > pageSize,
      source: 'NewsAPI'
    };
  }

  throw new Error('NewsAPI request failed');
};

// GNews implementation
const fetchFromGNews = async (options) => {
  const { page, pageSize, category, searchQuery } = options;
  
  // Check if we have a valid API key
  if (!NEWS_API_SOURCES.gnews.key || NEWS_API_SOURCES.gnews.key === 'demo') {
    throw new Error('No valid GNews API key');
  }
  
  let query = buildHealthQuery(category, searchQuery);
  
  const url = `${NEWS_API_SOURCES.gnews.baseUrl}${NEWS_API_SOURCES.gnews.endpoint}?` +
    `q=${encodeURIComponent(query)}&` +
    `page=${page}&` +
    `max=${pageSize}&` +
    `lang=en&` +
    `token=${NEWS_API_SOURCES.gnews.key}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`GNews error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.articles) {
    const transformedArticles = data.articles.map(transformGNewsArticle);
    const healthArticles = filterHealthArticles(transformedArticles);
    
    // Only return if we have health articles
    if (healthArticles.length === 0) {
      throw new Error('No health-related articles found');
    }
    
    return {
      success: true,
      articles: healthArticles,
      totalResults: healthArticles.length,
      hasMore: healthArticles.length === pageSize,
      source: 'GNews'
    };
  }

  throw new Error('GNews request failed');
};

// CurrentsAPI implementation
const fetchFromCurrentsAPI = async (options) => {
  const { page, pageSize, category, searchQuery } = options;
  
  // Check if we have a valid API key
  if (!NEWS_API_SOURCES.currentsapi.key || NEWS_API_SOURCES.currentsapi.key === 'demo') {
    throw new Error('No valid CurrentsAPI key');
  }
  
  let query = buildHealthQuery(category, searchQuery);
  
  const url = `${NEWS_API_SOURCES.currentsapi.baseUrl}${NEWS_API_SOURCES.currentsapi.endpoint}?` +
    `keywords=${encodeURIComponent(query)}&` +
    `page_number=${page}&` +
    `page_size=${pageSize}&` +
    `language=en&` +
    `apiKey=${NEWS_API_SOURCES.currentsapi.key}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`CurrentsAPI error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.news) {
    const transformedArticles = data.news.map(transformCurrentsAPIArticle);
    const healthArticles = filterHealthArticles(transformedArticles);
    
    // Only return if we have health articles
    if (healthArticles.length === 0) {
      throw new Error('No health-related articles found');
    }
    
    return {
      success: true,
      articles: healthArticles,
      totalResults: healthArticles.length,
      hasMore: healthArticles.length === pageSize,
      source: 'CurrentsAPI'
    };
  }

  throw new Error('CurrentsAPI request failed');
};

// WHO News Feed implementation (RSS to JSON conversion)
// WHO only publishes health news, so NO health filtering needed
const fetchFromWHO = async (options) => {
  const { pageSize = 20 } = options;
  
  try {
    console.log('🌍 Fetching WHO news feeds...');
    
    // Try multiple RSS2JSON services for reliability
    const rss2jsonServices = [
      // Service 1: rss2json.com (with API key)
      {
        url: 'https://api.rss2json.com/v1/api.json',
        key: 'zukbawsifwpdl6yygfqpqscxkm9zgjpnbg9rynxs'
      },
      // Service 2: rss2json.com (without API key - free tier)
      {
        url: 'https://api.rss2json.com/v1/api.json',
        key: null
      }
    ];
    
    const feeds = [
      'https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml',
      'https://www.who.int/feeds/entity/csr/don/en/rss.xml'
    ];
    
    // Try each service until one works
    for (const service of rss2jsonServices) {
      try {
        console.log(`Trying RSS2JSON service: ${service.url.includes('rss2json') ? 'rss2json.com' : 'alternative'}...`);
        
        // Fetch both feeds in parallel for faster loading
        const fetchPromises = feeds.map(async feedUrl => {
          try {
            let rss2jsonUrl = `${service.url}?rss_url=${encodeURIComponent(feedUrl)}&count=${pageSize}`;
            if (service.key) {
              rss2jsonUrl += `&api_key=${service.key}`;
            }
            
            const response = await fetch(rss2jsonUrl);
            
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'ok' && data.items && data.items.length > 0) {
                console.log(`✅ WHO feed fetched: ${data.items.length} items from ${feedUrl.includes('don') ? 'Disease Outbreak' : 'News'}`);
                return data.items.map(item => ({
                  id: item.guid || item.link,
                  title: item.title,
                  summary: item.description?.replace(/<[^>]*>/g, '').substring(0, 200) + '...' || '',
                  description: item.description?.replace(/<[^>]*>/g, '').substring(0, 200) + '...' || '',
                  content: item.content?.replace(/<[^>]*>/g, '') || item.description?.replace(/<[^>]*>/g, '') || '',
                  url: item.link,
                  imageUrl: item.enclosure?.link || item.thumbnail || 'https://www.who.int/images/default-source/logo/who-logo.png',
                  source: 'WHO',
                  author: 'World Health Organization',
                  publishedAt: item.pubDate,
                  category: 'breaking',
                  tags: ['WHO', 'Global Health', 'Public Health']
                }));
              }
            }
          } catch (feedError) {
            console.warn(`WHO feed ${feedUrl} fetch error:`, feedError.message);
          }
          return [];
        });
        
        const results = await Promise.all(fetchPromises);
        const articles = results.flat();
        
        if (articles.length > 0) {
          console.log(`✅ WHO: Successfully fetched ${articles.length} articles`);
          
          // Sort by date - newest first
          articles.sort((a, b) => {
            const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
            const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
            if (isNaN(dateA) && isNaN(dateB)) return 0;
            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;
            return dateB - dateA;
          });
          
          return {
            success: true,
            articles: articles.slice(0, pageSize),
            totalResults: articles.length,
            hasMore: false,
            source: 'WHO'
          };
        }
      } catch (serviceError) {
        console.warn(`RSS2JSON service failed:`, serviceError.message);
        continue; // Try next service
      }
    }
    
    throw new Error('All RSS2JSON services failed');
  } catch (error) {
    console.error('❌ WHO fetch error:', error.message);
    throw new Error(`WHO fetch error: ${error.message}`);
  }
};

// CDC News API implementation
// CDC only publishes health news, so NO health filtering needed
const fetchFromCDC = async (options) => {
  const { pageSize = 20, searchQuery = '' } = options;
  
  try {
    console.log('🏥 Fetching CDC news...');
    // Use only ONE topic to reduce API response size and time
    const topic = searchQuery || 'health';
    
    // Limit max to a reasonable number to avoid massive responses
    const maxArticles = Math.min(pageSize * 5, 100); // Get 5x what we need, max 100
    const url = `https://tools.cdc.gov/api/v2/resources/media?topic=${encodeURIComponent(topic)}&max=${maxArticles}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('CDC API request failed');
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      throw new Error('No CDC articles found');
    }
    
    console.log(`CDC topic "${topic}": Received ${data.results.length} articles`);
    
    // Debug: Log first article structure to understand available fields
    if (data.results.length > 0) {
      const sample = data.results[0];
      console.log('CDC article sample fields:', {
        id: sample.id,
        name: sample.name,
        url: sample.url,
        sourceUrl: sample.sourceUrl,
        permalinkUrl: sample.permalinkUrl,
        contentUrl: sample.contentUrl,
        syndicateUrl: sample.syndicateUrl
      });
    }
    
    // Process and sort articles efficiently
    const articles = data.results
      .slice(0, maxArticles) // Limit processing to avoid hanging
      .map(item => {
        // Extract the correct URL - CDC API has different URL fields
        // Priority: sourceUrl (actual article) > syndicateUrl > permalinkUrl > contentUrl
        let articleUrl = item.sourceUrl || item.syndicateUrl || item.permalinkUrl || item.contentUrl;
        
        // Fallback: if no valid URL or if it's an API URL, construct a CDC link
        if (!articleUrl || articleUrl.includes('/api/v2/resources')) {
          articleUrl = item.sourceUrl || `https://www.cdc.gov/media/releases/${item.id || ''}`;
        }
        
        return {
          id: item.id || `cdc-${Date.now()}-${Math.random()}`,
          title: item.name || item.title || 'CDC Health Update',
          summary: item.description?.substring(0, 200) + '...' || '',
          description: item.description?.substring(0, 200) + '...' || '',
          content: item.description || '',
          url: articleUrl,
          imageUrl: item.thumbnailUrl || 'https://www.cdc.gov/homepage/images/centers-for-disease-control-and-prevention.png',
          source: 'CDC',
          author: 'Centers for Disease Control and Prevention',
          publishedAt: item.datePublished || item.publishDate || new Date().toISOString(),
          category: 'prevention',
          tags: ['CDC', 'Prevention', topic]
        };
      })
      .sort((a, b) => {
        // Sort by date inline - newest first
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      })
      .slice(0, pageSize); // Take only what we need after sorting
    
    console.log(`✅ CDC: Processed ${articles.length} articles. First article date:`, articles[0]?.publishedAt);
    
    return {
      success: true,
      articles: articles,
      totalResults: articles.length,
      hasMore: false,
      source: 'CDC'
    };
  } catch (error) {
    console.error('❌ CDC fetch error:', error.message);
    throw new Error(`CDC fetch error: ${error.message}`);
  }
};

// PubMed Research Articles implementation
const fetchFromPubMed = async (options) => {
  const { pageSize = 20, searchQuery = '', category = 'all' } = options;
  
  try {
    // Build search query - PubMed is already medical, so no need for strict health filtering
    let query = searchQuery || 'health medicine medical disease';
    
    // For category-specific searches
    if (!searchQuery && category !== 'all' && CATEGORY_KEYWORDS[category]) {
      query = CATEGORY_KEYWORDS[category].join(' OR ');
    }
    
    // Only search recent articles (last 30 days for faster results)
    query = `${query}[Title/Abstract] AND "last 30 days"[PDat]`;
    
    // Reduce to 10 articles for faster performance
    const maxResults = Math.min(pageSize, 10);
    
    // Step 1: Search for article IDs
    const searchUrl = `${NEWS_API_SOURCES.pubmed.baseUrl}${NEWS_API_SOURCES.pubmed.searchEndpoint}?` +
      `db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
    
    console.log('🔍 PubMed search:', query);
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) throw new Error('PubMed search failed');
    
    const searchData = await searchResponse.json();
    const ids = searchData.esearchresult?.idlist || [];
    
    console.log(`📊 PubMed found ${ids.length} article IDs`);
    
    if (ids.length === 0) {
      throw new Error('No PubMed articles found');
    }
    
    // Step 2: Fetch article summaries
    const summaryUrl = `${NEWS_API_SOURCES.pubmed.baseUrl}${NEWS_API_SOURCES.pubmed.summaryEndpoint}?` +
      `db=pubmed&id=${ids.join(',')}&retmode=json`;
    
    const summaryResponse = await fetch(summaryUrl);
    if (!summaryResponse.ok) throw new Error('PubMed summary fetch failed');
    
    const summaryData = await summaryResponse.json();
    const articles = [];
    
    if (summaryData.result) {
      for (const id of ids) {
        const article = summaryData.result[id];
        if (article) {
          articles.push({
            id: `pubmed-${id}`,
            title: article.title || 'Untitled Research',
            summary: article.title?.substring(0, 200) + '...' || '',
            description: article.title?.substring(0, 200) + '...' || '',
            content: `${article.title || ''}\n\nAuthors: ${article.authors?.map(a => a.name).join(', ') || 'Unknown'}\n\nSource: ${article.source || 'PubMed'}`,
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            imageUrl: 'https://www.ncbi.nlm.nih.gov/corehtml/pmc/pmcgifs/pubmed-logo.png',
            source: 'PubMed',
            author: article.authors?.[0]?.name || 'Research Team',
            publishedAt: article.pubdate || new Date().toISOString(),
            category: 'research',
            tags: ['PubMed', 'Research', 'Medical Study']
          });
        }
      }
    }
    
    if (articles.length > 0) {
      console.log(`✅ PubMed: Successfully fetched ${articles.length} articles`);
      
      // Sort by date - newest first
      articles.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      });
      
      return {
        success: true,
        articles: articles,
        totalResults: articles.length,
        hasMore: false,
        source: 'PubMed'
      };
    }
    
    throw new Error('No PubMed articles fetched');
  } catch (error) {
    console.error('❌ PubMed fetch error:', error.message);
    throw new Error(`PubMed fetch error: ${error.message}`);
  }
};

// Build health-focused search query
const buildHealthQuery = (category, searchQuery) => {
  // If user provided a specific search, use it with strict health context
  if (searchQuery) {
    return `${searchQuery} (health OR medical OR disease OR healthcare)`;
  }
  
  // Category-specific health queries
  if (category !== 'all' && CATEGORY_KEYWORDS[category]) {
    const categoryTerm = CATEGORY_KEYWORDS[category][0];
    return `${categoryTerm} (health OR medical OR healthcare)`;
  }
  
  // Specific, diverse health queries that return relevant results
  const healthQueries = [
    'medical breakthrough research',
    'disease outbreak WHO', 
    'vaccine development clinical trial',
    'healthcare innovation hospital',
    'CDC health guidelines',
    'cancer treatment research',
    'mental health therapy',
    'diabetes management medical',
    'heart disease prevention',
    'infectious disease control',
    'pharmaceutical drug approval',
    'medical device innovation',
    'public health emergency',
    'health ministry announcement',
    'clinical study results'
  ];
  
  // Rotate through queries based on time for variety
  const index = Math.floor(Date.now() / 60000) % healthQueries.length;
  return healthQueries[index];
};

// Transform NewsAPI article format
const transformNewsAPIArticle = (article) => ({
  _id: generateArticleId(article.url),
  title: article.title,
  summary: article.description || generateSummary(article.content),
  content: article.content || article.description,
  category: categorizeArticle(article.title + ' ' + (article.description || '')),
  tags: extractTags(article.title + ' ' + (article.description || '')),
  author: article.author || article.source.name,
  source: article.source.name,
  publishedAt: new Date(article.publishedAt),
  readTime: calculateReadTime(article.content || article.description),
  priority: determinePriority(article),
  imageUrl: article.urlToImage,
  url: article.url,
  isBookmarked: false,
  views: Math.floor(Math.random() * 5000) + 100
});

// Transform GNews article format
const transformGNewsArticle = (article) => ({
  _id: generateArticleId(article.url),
  title: article.title,
  summary: article.description || generateSummary(article.content),
  content: article.content || article.description,
  category: categorizeArticle(article.title + ' ' + (article.description || '')),
  tags: extractTags(article.title + ' ' + (article.description || '')),
  author: article.source.name,
  source: article.source.name,
  publishedAt: new Date(article.publishedAt),
  readTime: calculateReadTime(article.content || article.description),
  priority: determinePriority(article),
  imageUrl: article.image,
  url: article.url,
  isBookmarked: false,
  views: Math.floor(Math.random() * 5000) + 100
});

// Transform CurrentsAPI article format
const transformCurrentsAPIArticle = (article) => ({
  _id: generateArticleId(article.url),
  title: article.title,
  summary: article.description || generateSummary(article.content),
  content: article.content || article.description,
  category: categorizeArticle(article.title + ' ' + (article.description || '')),
  tags: extractTags(article.title + ' ' + (article.description || '')),
  author: article.author || 'Unknown',
  source: 'Health News',
  publishedAt: new Date(article.published),
  readTime: calculateReadTime(article.content || article.description),
  priority: determinePriority(article),
  imageUrl: article.image,
  url: article.url,
  isBookmarked: false,
  views: Math.floor(Math.random() * 5000) + 100
});

// Filter articles to ensure they are health-related
const isHealthRelated = (article) => {
  const title = (article.title || '').toLowerCase();
  const summary = (article.summary || article.description || '').toLowerCase();
  const source = (article.source || '').toLowerCase();
  const content = `${title} ${summary}`;
  
  // Trusted health sources - auto-pass
  const trustedHealthSources = [
    'health', 'medical', 'medicine', 'hospital', 'clinic', 'mayo', 'cleveland',
    'hopkins', 'nih', 'cdc', 'who', 'webmd', 'healthline', 'medscape'
  ];
  
  const isTrustedSource = trustedHealthSources.some(term => source.includes(term));
  if (isTrustedSource) return true;
  
  // Basic health/medical terms - must have at least one
  const basicHealthTerms = [
    'health', 'medical', 'medicine', 'healthcare', 'hospital', 'doctor', 'physician',
    'disease', 'treatment', 'vaccine', 'drug', 'patient', 'diagnosis', 'symptoms',
    'cancer', 'diabetes', 'virus', 'infection', 'outbreak', 'epidemic',
    'clinical', 'pharmaceutical', 'surgery', 'who', 'cdc', 'fda'
  ];
  
  // Check if content contains health terms
  const hasHealthTerm = basicHealthTerms.some(term => content.includes(term));
  if (!hasHealthTerm) return false;
  
  // Only exclude if it's CLEARLY not health related
  const obviouslyNotHealth = [
    'nfl game', 'nba game', 'football match', 'basketball game', 'super bowl',
    'red carpet', 'box office', 'movie premiere', 'concert tour',
    'bitcoin price', 'stock market crash', 'cryptocurrency exchange',
    'video game release', 'gaming tournament', 'esports'
  ];
  
  const isObviouslyNotHealth = obviouslyNotHealth.some(term => content.includes(term));
  
  return !isObviouslyNotHealth;
};

// Filter articles array to keep only health-related content
const filterHealthArticles = (articles) => {
  return articles.filter(isHealthRelated);
};

// Enhanced mock data for fallback
const fetchEnhancedMockData = async (options) => {
  const { page, pageSize, category, searchQuery } = options;
  
  // Generate dynamic mock news
  const mockArticles = generateDynamicMockNews(pageSize, category, searchQuery);
  
  return {
    success: true,
    articles: mockArticles,
    totalResults: 500, // Simulate large dataset
    hasMore: page < 25, // Simulate 25 pages of content
    source: 'Enhanced Mock Data'
  };
};

// Generate dynamic mock news with current dates and relevant content
const generateDynamicMockNews = (count, category, searchQuery) => {
  const articles = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const hoursAgo = Math.floor(Math.random() * 72); // Last 3 days
    const publishedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    
    articles.push({
      _id: `mock-${Date.now()}-${i}`,
      title: generateMockTitle(category, i),
      summary: generateMockSummary(category, i),
      content: generateMockContent(category, i),
      category: category === 'all' ? getRandomCategory() : category,
      tags: generateMockTags(category),
      author: getRandomAuthor(),
      source: getRandomSource(),
      publishedAt,
      readTime: Math.floor(Math.random() * 8) + 2,
      priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      imageUrl: generateMockImageUrl(category),
      url: `https://example.com/news/mock-${i}`,
      isBookmarked: false,
      views: Math.floor(Math.random() * 10000) + 100
    });
  }
  
  return articles;
};

// Utility functions
const generateArticleId = (url) => {
  // Create a more unique ID by combining timestamp, random number, and URL hash
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const urlHash = btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  return `${timestamp}-${random}-${urlHash}`;
};

const generateSummary = (content) => {
  if (!content) return 'Health news summary not available.';
  return content.substring(0, 200) + '...';
};

const calculateReadTime = (content) => {
  if (!content) return 2;
  const words = content.split(' ').length;
  return Math.max(1, Math.ceil(words / 200)); // 200 words per minute
};

const categorizeArticle = (text) => {
  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }
  
  return 'general';
};

const extractTags = (text) => {
  const commonTags = ['health', 'medical', 'research', 'treatment', 'wellness'];
  const tags = [];
  
  HEALTH_KEYWORDS.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      tags.push(keyword);
    }
  });
  
  return tags.length > 0 ? tags.slice(0, 5) : commonTags.slice(0, 3);
};

const determinePriority = (article) => {
  const urgentKeywords = ['breaking', 'urgent', 'crisis', 'emergency', 'outbreak'];
  const text = (article.title + ' ' + (article.description || '')).toLowerCase();
  
  if (urgentKeywords.some(keyword => text.includes(keyword))) {
    return 'high';
  }
  
  const recentHours = (new Date() - new Date(article.publishedAt)) / (1000 * 60 * 60);
  return recentHours < 6 ? 'high' : recentHours < 24 ? 'medium' : 'low';
};

// Mock data generators
const getRandomCategory = () => {
  const categories = ['research', 'prevention', 'heart_health', 'mental_health', 'nutrition', 'fitness'];
  return categories[Math.floor(Math.random() * categories.length)];
};

const getRandomAuthor = () => {
  const authors = [
    'Dr. Rajesh Kumar', 'Dr. Priya Sharma', 'Dr. Vikram Singh', 'Dr. Anjali Mehta',
    'Dr. Arjun Nair', 'Dr. Kavita Reddy', 'Dr. Ravi Patel', 'Dr. Sunita Gupta'
  ];
  return authors[Math.floor(Math.random() * authors.length)];
};

const getRandomSource = () => {
  const sources = [
    'Medical News Today', 'Health Journal', 'Science Daily', 'Medical Research Weekly',
    'Health & Wellness Times', 'Clinical Studies Today', 'Healthcare Innovation'
  ];
  return sources[Math.floor(Math.random() * sources.length)];
};

const generateMockTitle = (category, index) => {
  const titles = {
    research: [
      'New Study Reveals Breakthrough in Cancer Treatment',
      'Revolutionary Gene Therapy Shows Promise in Clinical Trials',
      'Researchers Discover Link Between Sleep and Immune Function',
      'Groundbreaking Research on Alzheimer\'s Prevention Published'
    ],
    prevention: [
      'Latest Vaccination Guidelines Released by Health Authorities',
      'Preventive Measures Reduce Heart Disease Risk by 60%',
      'New Screening Method Detects Early Signs of Diabetes',
      'Public Health Campaign Launches to Prevent Obesity'
    ],
    heart_health: [
      'Mediterranean Diet Linked to Better Heart Health Outcomes',
      'Exercise Program Reduces Cardiovascular Risk in Seniors',
      'New Heart Medication Shows Significant Benefits',
      'Blood Pressure Control: Latest Treatment Guidelines'
    ]
  };
  
  const categoryTitles = titles[category] || titles.research;
  return categoryTitles[index % categoryTitles.length];
};

const generateMockSummary = (category, index) => {
  return `This comprehensive health news article discusses the latest developments in ${category || 'medical research'}. The findings have significant implications for patient care and treatment outcomes.`;
};

const generateMockContent = (category, index) => {
  return `Detailed analysis of recent ${category || 'medical'} developments shows promising results for patients and healthcare providers. This breakthrough research could revolutionize treatment approaches and improve patient outcomes significantly.`;
};

const generateMockTags = (category) => {
  const tagMap = {
    research: ['clinical trial', 'study', 'research'],
    prevention: ['prevention', 'screening', 'awareness'],
    heart_health: ['heart', 'cardiovascular', 'prevention'],
    mental_health: ['mental health', 'therapy', 'wellness']
  };
  
  return tagMap[category] || ['health', 'medical', 'news'];
};

const generateMockImageUrl = (category) => {
  const baseUrl = 'https://images.unsplash.com/';
  const healthImages = [
    'photo-1559757148-5c350d0d3c56?w=400', // Medical equipment
    'photo-1576091160399-112ba8d25d1f?w=400', // Doctor
    'photo-1582750433449-648ed127bb54?w=400', // Hospital
    'photo-1551601651-bc60e55b8ce5?w=400', // Health technology
    'photo-1579952363873-27d3bfad9c0d?w=400'  // Medical research
  ];
  
  return baseUrl + healthImages[Math.floor(Math.random() * healthImages.length)];
};

// Build query for official health organizations
const buildOfficialHealthQuery = (category, searchQuery) => {
  if (searchQuery) {
    return `(${searchQuery}) AND (health OR medical OR WHO OR CDC OR NIH OR FDA)`;
  }
  
  const officialTerms = [
    'WHO statement', 'CDC report', 'NIH research', 'FDA approval',
    'health department', 'medical breakthrough', 'clinical trial',
    'vaccine update', 'health advisory', 'medical guidelines'
  ];
  
  const categoryTerms = CATEGORY_KEYWORDS[category] || ['health'];
  const combinedTerms = [...officialTerms, ...categoryTerms];
  
  return combinedTerms.slice(0, 10).join(' OR ');
};

// Deduplicate articles based on title similarity
const deduplicateArticles = (articles) => {
  const seen = new Set();
  const unique = [];
  
  for (const article of articles) {
    // Create a normalized title for comparison
    const normalizedTitle = article.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Skip if we've seen a very similar title
    const isDuplicate = Array.from(seen).some(seenTitle => {
      const similarity = calculateSimilarity(normalizedTitle, seenTitle);
      return similarity > 0.8; // 80% similarity threshold
    });
    
    if (!isDuplicate) {
      seen.add(normalizedTitle);
      unique.push(article);
    }
  }
  
  return unique;
};

// Calculate title similarity using Levenshtein distance
const calculateSimilarity = (str1, str2) => {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  
  const distance = track[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - (distance / maxLength);
};

// Enhanced diverse mock data generator
const fetchDiverseMockData = async (options) => {
  const { page, pageSize, category, searchQuery } = options;
  
  // Create diverse mock articles from different types of sources
  const diverseArticles = [
    // WHO/CDC type articles
    ...generateOfficialHealthArticles(Math.ceil(pageSize * 0.3)),
    // Medical journal type articles
    ...generateResearchArticles(Math.ceil(pageSize * 0.3)),
    // International news type articles
    ...generateInternationalNewsArticles(Math.ceil(pageSize * 0.2)),
    // Health tech/innovation articles
    ...generateHealthTechArticles(Math.ceil(pageSize * 0.2))
  ];
  
  // Filter based on search query if provided
  let filteredArticles = diverseArticles;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredArticles = diverseArticles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.summary.toLowerCase().includes(query) ||
      article.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }
  
  // Paginate results
  const startIndex = (page - 1) * pageSize;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + pageSize);
  
  const result = {
    success: true,
    articles: paginatedArticles,
    totalResults: filteredArticles.length,
    hasMore: startIndex + pageSize < filteredArticles.length,
    source: 'Diverse Health Sources (Mock Data)'
  };
  
  return result;
};

// Generate official health organization style articles
const generateOfficialHealthArticles = (count) => {
  const sources = ['WHO', 'CDC', 'NIH', 'FDA', 'Health Ministry'];
  const topics = [
    'issues new health guidelines for',
    'reports breakthrough in',
    'warns about emerging',
    'approves new treatment for',
    'updates recommendations on'
  ];
  const conditions = [
    'diabetes management', 'heart disease prevention', 'mental health care',
    'infectious disease control', 'vaccine safety', 'cancer screening'
  ];
  
  return Array.from({ length: count }, (_, index) => {
    const source = sources[index % sources.length];
    const topic = topics[index % topics.length];
    const condition = conditions[index % conditions.length];
    
    return {
      _id: `official-${Date.now()}-${Math.random().toString(36).substring(2)}-${index}`,
      title: `${source} ${topic} ${condition}`,
      summary: `The ${source} has announced important updates regarding ${condition}. This comprehensive report outlines new protocols and recommendations for healthcare professionals and the public.`,
      content: `The ${source} has announced important updates regarding ${condition}. This comprehensive report outlines new protocols and recommendations for healthcare professionals and the public. These guidelines are based on the latest scientific evidence and expert consensus. Healthcare providers are encouraged to review and implement these recommendations in their practice to improve patient outcomes.`,
      category: 'official',
      author: `${source} Communications Team`,
      source: source,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://${source.toLowerCase().replace(' ', '')}.gov/news/latest-${Date.now()}-${index}`,
      imageUrl: generateMockImageUrl('official'),
      tags: ['official', 'guidelines', condition.split(' ')[0]],
      readTime: Math.floor(Math.random() * 5) + 3,
      views: Math.floor(Math.random() * 10000) + 1000,
      priority: Math.random() > 0.7 ? 'high' : 'medium',
      isBookmarked: false
    };
  });
};

// Generate research/medical journal style articles
const generateResearchArticles = (count) => {
  const journals = ['Nature Medicine', 'The Lancet', 'NEJM', 'BMJ', 'JAMA'];
  const studies = [
    'Large-scale study reveals',
    'Clinical trial demonstrates',
    'Meta-analysis confirms',
    'Longitudinal research shows',
    'Randomized trial proves'
  ];
  const findings = [
    'effectiveness of new drug therapy',
    'link between lifestyle and disease',
    'potential of gene therapy',
    'benefits of preventive care',
    'impact of environmental factors'
  ];
  
  return Array.from({ length: count }, (_, index) => {
    const journal = journals[index % journals.length];
    const study = studies[index % studies.length];
    const finding = findings[index % findings.length];
    
    return {
      _id: `research-${Date.now()}-${Math.random().toString(36).substring(2)}-${index}`,
      title: `${study} ${finding}`,
      summary: `A groundbreaking study published in ${journal} provides new insights into ${finding}. The research involved thousands of participants and offers promising implications for future treatments.`,
      content: `A groundbreaking study published in ${journal} provides new insights into ${finding}. The research involved thousands of participants and offers promising implications for future treatments. The study methodology was rigorous, involving peer review and statistical analysis. Results show significant improvements in patient outcomes and provide a foundation for further research in this area.`,
      category: 'research',
      author: `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][index % 5]} et al.`,
      source: journal,
      publishedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://${journal.toLowerCase().replace(' ', '')}.com/articles/latest-${Date.now()}-${index}`,
      imageUrl: generateMockImageUrl('research'),
      tags: ['research', 'study', 'medical'],
      readTime: Math.floor(Math.random() * 8) + 5,
      views: Math.floor(Math.random() * 5000) + 500,
      priority: 'medium',
      isBookmarked: false
    };
  });
};

// Generate international health news articles
const generateInternationalNewsArticles = (count) => {
  const sources = ['BBC Health', 'Reuters Health', 'CNN Health', 'AP Medical', 'NPR Health'];
  const locations = ['Europe', 'Asia', 'Africa', 'South America', 'Australia'];
  const events = [
    'healthcare system reforms in',
    'disease outbreak contained in',
    'medical breakthrough announced in',
    'health crisis addressed in',
    'vaccination campaign launched in'
  ];
  
  return Array.from({ length: count }, (_, index) => {
    const source = sources[index % sources.length];
    const location = locations[index % locations.length];
    const event = events[index % events.length];
    
    return {
      _id: `international-${Date.now()}-${Math.random().toString(36).substring(2)}-${index}`,
      title: `${event} ${location}`,
      summary: `${source} reports on significant health developments in ${location}. The story highlights global health cooperation and innovative approaches to addressing medical challenges worldwide.`,
      content: `${source} reports on significant health developments in ${location}. The story highlights global health cooperation and innovative approaches to addressing medical challenges worldwide. Local authorities are working closely with international health organizations to ensure effective implementation of health initiatives and policies.`,
      category: 'international',
      author: `${source} Health Correspondent`,
      source: source,
      publishedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://${source.toLowerCase().replace(' ', '')}.com/health/international-${Date.now()}-${index}`,
      imageUrl: generateMockImageUrl('international'),
      tags: ['international', 'global health', location.toLowerCase()],
      readTime: Math.floor(Math.random() * 6) + 3,
      views: Math.floor(Math.random() * 15000) + 2000,
      priority: Math.random() > 0.8 ? 'high' : 'low',
      isBookmarked: false
    };
  });
};

// Generate health tech and innovation articles
const generateHealthTechArticles = (count) => {
  const companies = ['Apple Health', 'Google Health', 'Microsoft Healthcare', 'Amazon Health', 'IBM Watson Health'];
  const technologies = ['AI diagnosis system', 'telemedicine platform', 'wearable health device', 'digital therapeutics', 'robotic surgery system'];
  const developments = [
    'launches revolutionary',
    'partners with hospitals for',
    'receives FDA approval for',
    'expands access to',
    'demonstrates breakthrough in'
  ];
  
  return Array.from({ length: count }, (_, index) => {
    const company = companies[index % companies.length];
    const tech = technologies[index % technologies.length];
    const development = developments[index % developments.length];
    
    return {
      _id: `healthtech-${Date.now()}-${Math.random().toString(36).substring(2)}-${index}`,
      title: `${company} ${development} ${tech}`,
      summary: `In a major advancement for digital health, ${company} has made significant progress with their ${tech}. This innovation promises to transform patient care and improve health outcomes globally.`,
      content: `In a major advancement for digital health, ${company} has made significant progress with their ${tech}. This innovation promises to transform patient care and improve health outcomes globally. The technology leverages cutting-edge algorithms and user-friendly interfaces to provide accessible healthcare solutions for patients and providers alike.`,
      category: 'technology',
      author: 'Health Tech Reporter',
      source: company,
      publishedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://${company.toLowerCase().replace(' ', '')}.com/health/news-${Date.now()}-${index}`,
      imageUrl: generateMockImageUrl('technology'),
      tags: ['technology', 'innovation', 'digital health'],
      readTime: Math.floor(Math.random() * 7) + 4,
      views: Math.floor(Math.random() * 8000) + 1500,
      priority: 'medium',
      isBookmarked: false
    };
  });
};

// Export default service
export default {
  fetchHealthNews,
  buildHealthQuery,
  buildOfficialHealthQuery,
  deduplicateArticles,
  fetchDiverseMockData,
  HEALTH_KEYWORDS,
  CATEGORY_KEYWORDS,
  PRIORITY_HEALTH_SOURCES
};