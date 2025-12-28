import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  NewspaperIcon,
  ClockIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  ShareIcon,
  EyeIcon,
  ArrowUpIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { 
  BookmarkIcon as BookmarkSolidIcon,
  HeartIcon as HeartSolidIcon
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { fetchHealthNews } from '../utils/newsService';

function HealthNews() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarkedArticles, setBookmarkedArticles] = useState(new Set());
  const [likedArticles, setLikedArticles] = useState(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [newsSource, setNewsSource] = useState('Loading...');
  
  const observerRef = useRef();
  const searchTimeoutRef = useRef();

  // Infinite scroll observer
  const lastArticleElementRef = useCallback(node => {
    if (isLoadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreArticles();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, hasMore]);

  useEffect(() => {
    loadArticles(true);
  }, [selectedCategory]);

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      filterArticles();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadArticles = async (reset = false) => {
    try {
      setIsLoading(reset);
      setError(null);
      
      const page = reset ? 1 : currentPage;
      
      const result = await fetchHealthNews({
        page,
        pageSize: 20,
        category: selectedCategory,
        searchQuery
      });

      if (result.success) {
        setArticles(prev => reset ? result.articles : [...prev, ...result.articles]);
        setHasMore(result.hasMore);
        setTotalResults(result.totalResults);
        setCurrentPage(reset ? 2 : page + 1);
        setNewsSource(result.source);
        
        if (reset) {
          toast.success(`Loaded ${result.articles.length} latest health news articles`);
        }
      } else {
        throw new Error('Failed to load news articles');
      }
    } catch (error) {
      console.error('Error loading articles:', error);
      setError(error.message);
      toast.error('Failed to load news articles');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreArticles = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    await loadArticles(false);
    setIsLoadingMore(false);
  };

  const filterArticles = useCallback(() => {
    let filtered = [...articles];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        (article.summary || article.description || '').toLowerCase().includes(query) ||
        (article.tags || []).some(tag => tag.toLowerCase().includes(query)) ||
        article.author.toLowerCase().includes(query)
      );
    }
    
    // Sort by date - newest first
    filtered.sort((a, b) => {
      // Parse dates more robustly
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      
      // If dates are invalid, put them at the end
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      
      return dateB - dateA; // Descending order (newest first)
    });
    
    console.log('Filtered articles sorted:', filtered.length, 'articles');
    if (filtered.length > 0) {
      console.log('First article date:', filtered[0].publishedAt, 'Title:', filtered[0].title);
      console.log('Last article date:', filtered[filtered.length - 1].publishedAt);
    }
    
    setFilteredArticles(filtered);
  }, [articles, searchQuery]);

  useEffect(() => {
    filterArticles();
  }, [filterArticles]);

  const toggleBookmark = (articleId) => {
    setBookmarkedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
        toast.success('Bookmark removed');
      } else {
        newSet.add(articleId);
        toast.success('Article bookmarked');
      }
      return newSet;
    });
  };

  const toggleLike = (articleId) => {
    setLikedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
        toast.success('Article liked!');
      }
      return newSet;
    });
  };

  const shareArticle = (article) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary || article.description || '',
        url: article.url || window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(article.url || window.location.href).then(() => {
        toast.success('Article link copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to share article');
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (date) => {
    const now = new Date();
    const articleDate = new Date(date);
    const diffInHours = Math.floor((now - articleDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    return articleDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: articleDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading health news...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
             Health News Center
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Stay updated with the latest health and medical news
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <GlobeAltIcon className="h-4 w-4" />
            <span>Powered by {newsSource}</span>
            <span>•</span>
            <span>{totalResults.toLocaleString()} articles available</span>
            <span>•</span>
            <span>Auto-refreshed</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search health news, topics, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => loadArticles(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh News
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {['all', 'breaking', 'research', 'prevention', 'heart_health', 'mental_health'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                }`}
              >
                {category.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading latest health news...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading News</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={() => loadArticles(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Articles List - Block Style */}
        {!isLoading && filteredArticles.length > 0 && (
          <div className="space-y-4 mb-8">
            {filteredArticles.map((article, index) => {
              const articleId = article._id || article.id;
              const isBookmarked = bookmarkedArticles.has(articleId);
              const isLiked = likedArticles.has(articleId);
              const isLastArticle = index === filteredArticles.length - 1;

              return (
                <div
                  key={articleId}
                  ref={isLastArticle ? lastArticleElementRef : null}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300 p-6 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Priority Badge */}
                      {article.priority === 'high' && (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full mb-2 bg-red-100 text-red-800">
                          Breaking
                        </span>
                      )}

                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600">
                        <a
                          href={article.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {article.title}
                        </a>
                      </h3>

                      {/* Meta Information */}
                      <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500 mb-3">
                        <span className="font-medium">{article.source}</span>
                        <span>•</span>
                        <span>{formatDate(article.publishedAt)}</span>
                        {article.author && article.author !== 'Unknown' && (
                          <>
                            <span>•</span>
                            <span>{article.author}</span>
                          </>
                        )}
                      </div>

                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {(article.tags || []).slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleBookmark(articleId)}
                        className={`p-2 rounded-lg transition-colors ${
                          isBookmarked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                        title="Bookmark"
                      >
                        {isBookmarked ? (
                          <BookmarkSolidIcon className="h-5 w-5" />
                        ) : (
                          <BookmarkIcon className="h-5 w-5" />
                        )}
                      </button>

                      <a
                        href={article.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Read
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading More Indicator */}
        {isLoadingMore && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600">Loading more articles...</p>
          </div>
        )}

        {/* No More Articles */}
        {!isLoading && !hasMore && filteredArticles.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">🎉 You've reached the end! No more articles to load.</p>
            <button
              onClick={() => loadArticles(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Refresh for Latest News
            </button>
          </div>
        )}

        {/* No Articles Found */}
        {!isLoading && filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <NewspaperIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search terms.' : 'No articles available for this category.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                loadArticles(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        >
          <ArrowUpIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

export default HealthNews;