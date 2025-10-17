// Advanced News Service with real APIs and infinite scroll support

const NEWS_API_SOURCES = {
  // Primary API - NewsAPI (requires API key)
  newsapi: {
    baseUrl: 'https://newsapi.org/v2',
    key: import.meta.env.VITE_NEWS_API_KEY || null, // Only use if valid key is provided
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
  }
};

// Health-related keywords for better news filtering and diversity
const HEALTH_KEYWORDS = [
  'health', 'medical', 'medicine', 'healthcare', 'hospital', 'doctor', 'disease',
  'treatment', 'therapy', 'clinical trial', 'vaccine', 'drug', 'pharmaceutical',
  'wellness', 'fitness', 'nutrition', 'diet', 'mental health', 'covid', 'virus',
  'bacteria', 'infection', 'diagnosis', 'prevention', 'symptoms', 'research',
  'study', 'breakthrough', 'cure', 'cancer', 'diabetes', 'heart disease',
  'alzheimer', 'depression', 'anxiety', 'obesity', 'surgery', 'medical device',
  // WHO/CDC specific terms
  'WHO', 'World Health Organization', 'CDC', 'Centers for Disease Control',
  'NIH', 'National Institutes of Health', 'FDA', 'Food and Drug Administration',
  // Global health terms
  'pandemic', 'epidemic', 'outbreak', 'public health', 'global health',
  'health policy', 'telemedicine', 'digital health', 'AI healthcare', 'biotech',
  // Specialized medical terms
  'immunology', 'cardiology', 'oncology', 'neurology', 'psychiatry', 'pediatrics'
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

  // Check if we have valid API keys, if not, go straight to mock data
  const hasValidNewsAPIKey = NEWS_API_SOURCES.newsapi.key && NEWS_API_SOURCES.newsapi.key !== 'demo' && NEWS_API_SOURCES.newsapi.key.length > 10;
  const hasValidGNewsKey = NEWS_API_SOURCES.gnews.key && NEWS_API_SOURCES.gnews.key !== 'demo' && NEWS_API_SOURCES.gnews.key.length > 10;
  const hasValidCurrentsKey = NEWS_API_SOURCES.currentsapi.key && NEWS_API_SOURCES.currentsapi.key !== 'demo' && NEWS_API_SOURCES.currentsapi.key.length > 10;

  // If no valid API keys are available, use mock data immediately
  if (!hasValidNewsAPIKey && !hasValidGNewsKey && !hasValidCurrentsKey) {
    console.info('No valid API keys found. Using mock health news data for demonstration.');
    return await fetchDiverseMockData(options);
  }

  // Build strategies array based on available API keys
  const strategies = [];
  
  if (hasValidNewsAPIKey) {
    strategies.push(
      () => fetchFromPriorityHealthSources(options),
      () => fetchFromInternationalSources(options),
      () => fetchFromNewsAPI(options)
    );
  }
  
  if (hasValidGNewsKey) {
    strategies.push(() => fetchFromGNews(options));
  }
  
  if (hasValidCurrentsKey) {
    strategies.push(() => fetchFromCurrentsAPI(options));
  }

  // Always add mock data as fallback
  strategies.push(() => fetchDiverseMockData(options));

  // Rotate strategies based on page for variety (excluding mock data)
  const apiStrategies = strategies.slice(0, -1);
  const primaryStrategy = apiStrategies.length > 0 ? apiStrategies[page % apiStrategies.length] : null;
  const fallbackStrategies = apiStrategies.filter(s => s !== primaryStrategy);

  // Try primary strategy first (if available)
  if (primaryStrategy) {
    try {
      const result = await primaryStrategy();
      if (result.success && result.articles.length > 0) {
        return {
          ...result,
          articles: deduplicateArticles(result.articles)
        };
      }
    } catch (error) {
      console.warn('Primary news source failed:', error.message);
    }
  }

  // Try fallback strategies
  for (const fetchSource of fallbackStrategies) {
    try {
      const result = await fetchSource();
      if (result.success && result.articles.length > 0) {
        return {
          ...result,
          articles: deduplicateArticles(result.articles)
        };
      }
    } catch (error) {
      console.warn('Fallback news source failed:', error.message);
      continue;
    }
  }

  // If all API sources fail, return diverse mock data
  console.info('All API sources failed. Using mock health news data.');
  return await fetchDiverseMockData(options);
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
  
  const url = `${NEWS_API_SOURCES.newsapi.baseUrl}${NEWS_API_SOURCES.newsapi.endpoint}?` +
    `q=${encodeURIComponent(query)}&` +
    `page=${page}&` +
    `pageSize=${pageSize}&` +
    `sortBy=publishedAt&` +
    `language=en&` +
    `apiKey=${NEWS_API_SOURCES.newsapi.key}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.status === 'ok' && data.articles) {
    return {
      success: true,
      articles: data.articles.map(transformNewsAPIArticle),
      totalResults: data.totalResults,
      hasMore: (page * pageSize) < data.totalResults,
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
    return {
      success: true,
      articles: data.articles.map(transformGNewsArticle),
      totalResults: data.totalArticles,
      hasMore: data.articles.length === pageSize,
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
    return {
      success: true,
      articles: data.news.map(transformCurrentsAPIArticle),
      totalResults: data.totalCount,
      hasMore: data.news.length === pageSize,
      source: 'CurrentsAPI'
    };
  }

  throw new Error('CurrentsAPI request failed');
};

// Build health-focused search query
const buildHealthQuery = (category, searchQuery) => {
  let query = searchQuery || '';
  
  if (category !== 'all' && CATEGORY_KEYWORDS[category]) {
    const categoryTerms = CATEGORY_KEYWORDS[category].join(' OR ');
    query = query ? `(${query}) AND (${categoryTerms})` : categoryTerms;
  }
  
  // Always include health context
  const healthContext = HEALTH_KEYWORDS.slice(0, 10).join(' OR ');
  query = query ? `(${query}) AND (${healthContext})` : healthContext;
  
  return query;
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
  return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
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
      _id: `official-${Date.now()}-${index}`,
      title: `${source} ${topic} ${condition}`,
      summary: `The ${source} has announced important updates regarding ${condition}. This comprehensive report outlines new protocols and recommendations for healthcare professionals and the public.`,
      content: `The ${source} has announced important updates regarding ${condition}. This comprehensive report outlines new protocols and recommendations for healthcare professionals and the public. These guidelines are based on the latest scientific evidence and expert consensus. Healthcare providers are encouraged to review and implement these recommendations in their practice to improve patient outcomes.`,
      category: 'official',
      author: `${source} Communications Team`,
      source: source,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://${source.toLowerCase().replace(' ', '')}.gov/news/latest`,
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
      _id: `research-${Date.now()}-${index}`,
      title: `${study} ${finding}`,
      summary: `A groundbreaking study published in ${journal} provides new insights into ${finding}. The research involved thousands of participants and offers promising implications for future treatments.`,
      content: `A groundbreaking study published in ${journal} provides new insights into ${finding}. The research involved thousands of participants and offers promising implications for future treatments. The study methodology was rigorous, involving peer review and statistical analysis. Results show significant improvements in patient outcomes and provide a foundation for further research in this area.`,
      category: 'research',
      author: `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][index % 5]} et al.`,
      source: journal,
      publishedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://${journal.toLowerCase().replace(' ', '')}.com/articles/latest`,
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
      _id: `international-${Date.now()}-${index}`,
      title: `${event} ${location}`,
      summary: `${source} reports on significant health developments in ${location}. The story highlights global health cooperation and innovative approaches to addressing medical challenges worldwide.`,
      content: `${source} reports on significant health developments in ${location}. The story highlights global health cooperation and innovative approaches to addressing medical challenges worldwide. Local authorities are working closely with international health organizations to ensure effective implementation of health initiatives and policies.`,
      category: 'international',
      author: `${source} Health Correspondent`,
      source: source,
      publishedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://${source.toLowerCase().replace(' ', '')}.com/health/international`,
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
      _id: `healthtech-${Date.now()}-${index}`,
      title: `${company} ${development} ${tech}`,
      summary: `In a major advancement for digital health, ${company} has made significant progress with their ${tech}. This innovation promises to transform patient care and improve health outcomes globally.`,
      content: `In a major advancement for digital health, ${company} has made significant progress with their ${tech}. This innovation promises to transform patient care and improve health outcomes globally. The technology leverages cutting-edge algorithms and user-friendly interfaces to provide accessible healthcare solutions for patients and providers alike.`,
      category: 'technology',
      author: 'Health Tech Reporter',
      source: company,
      publishedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://${company.toLowerCase().replace(' ', '')}.com/health/news`,
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