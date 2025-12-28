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
          const articles = result.rss.channel[0].item.map((item, index) => ({
            id: `who-${Date.now()}-${index}`,
            title: item.title[0],
            url: item.link[0],
            source: 'WHO',
            publishedAt: new Date(item.pubDate[0]),
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
        max: 50,
        sort: 'date desc'
      }
    });
    
    if (response.data && response.data.results) {
      return response.data.results.map((item, index) => ({
        id: `cdc-${Date.now()}-${index}`,
        title: item.name || item.title,
        url: item.sourceUrl || item.url,
        source: 'CDC',
        publishedAt: new Date(item.datePublished || item.publishDate),
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
    const searchResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
      timeout: 8000,
      params: {
        db: 'pubmed',
        term: 'disease[Title] AND ("last 60 days"[PDat])',
        retmax: 30,
        retmode: 'json',
        sort: 'pub_date'
      }
    });
    
    if (searchResponse.data.esearchresult && searchResponse.data.esearchresult.idlist) {
      const ids = searchResponse.data.esearchresult.idlist;
      
      if (ids.length > 0) {
        const summaryResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', {
          timeout: 8000,
          params: {
            db: 'pubmed',
            id: ids.join(','),
            retmode: 'json'
          }
        });
        
        if (summaryResponse.data.result) {
          return ids.map((id) => {
            const article = summaryResponse.data.result[id];
            return {
              id: `pubmed-${id}`,
              title: article.title || 'Research Article',
              url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
              source: 'PubMed',
              publishedAt: new Date(article.pubdate || Date.now()),
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
    const { page = 1, limit = 20 } = req.query;
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
      console.log(`📦 Using cached news (${newsCache.articles.length} articles)`);
    }

    // Paginate
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedArticles = newsCache.articles.slice(startIndex, endIndex);
    const hasMore = endIndex < newsCache.articles.length;

    res.json({
      success: true,
      data: {
        articles: paginatedArticles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: newsCache.articles.length,
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
