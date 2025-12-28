import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NewspaperIcon, ArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'ansh1720.github.io' 
    ? 'https://medisync-api-9043.onrender.com/api' 
    : 'http://localhost:5000/api');

function HealthNews() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const observerRef = useRef();

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
  }, []);

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
      
      const response = await axios.get(`${API_BASE_URL}/news`, {
        params: { page, limit: 20 },
        timeout: 60000
      });

      if (response.data.success) {
        const newArticles = response.data.data.articles;
        setArticles(prev => reset ? newArticles : [...prev, ...newArticles]);
        setHasMore(response.data.data.pagination.hasMore);
        setCurrentPage(reset ? 2 : page + 1);
        
        if (reset) {
          toast.success(`Loaded ${newArticles.length} latest health news articles`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <NewspaperIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Health News</h1>
          </div>
          <p className="text-gray-600">Latest updates from WHO, CDC, and PubMed</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading latest health news...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
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

        {/* Articles List - Stack View */}
        {!isLoading && articles.length > 0 && (
          <div className="space-y-3 mb-8">
            {articles.map((article, index) => {
              const isLastArticle = index === articles.length - 1;

              return (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  ref={isLastArticle ? lastArticleElementRef : null}
                  className="block bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 p-5 border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Title */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>

                      {/* Meta Information */}
                      <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500">
                        <span className="font-medium text-blue-600">{article.source}</span>
                        <span>•</span>
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                    </div>

                    {/* Arrow Icon */}
                    <svg className="h-5 w-5 text-gray-400 ml-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
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
        {!isLoading && !hasMore && articles.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">You've reached the end</p>
          </div>
        )}

        {/* No Articles Found */}
        {!isLoading && articles.length === 0 && !error && (
          <div className="text-center py-12">
            <NewspaperIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600 mb-4">No news articles available at the moment.</p>
            <button
              onClick={() => loadArticles(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
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
