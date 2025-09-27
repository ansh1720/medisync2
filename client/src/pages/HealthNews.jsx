import { useState, useEffect } from 'react';
import { newsAPI } from '../utils/api';
import { 
  NewspaperIcon,
  ClockIcon,
  TagIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  HeartIcon,
  UserGroupIcon,
  BeakerIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const NEWS_CATEGORIES = [
  { value: 'all', label: 'All News', icon: NewspaperIcon, color: 'gray' },
  { value: 'breaking', label: 'Breaking News', icon: ExclamationTriangleIcon, color: 'red' },
  { value: 'research', label: 'Medical Research', icon: BeakerIcon, color: 'blue' },
  { value: 'prevention', label: 'Prevention', icon: ShieldCheckIcon, color: 'green' },
  { value: 'heart_health', label: 'Heart Health', icon: HeartIcon, color: 'red' },
  { value: 'mental_health', label: 'Mental Health', icon: UserGroupIcon, color: 'purple' },
  { value: 'nutrition', label: 'Nutrition', icon: InformationCircleIcon, color: 'orange' },
  { value: 'fitness', label: 'Fitness', icon: UserGroupIcon, color: 'indigo' },
  { value: 'technology', label: 'Health Tech', icon: BeakerIcon, color: 'teal' },
  { value: 'policy', label: 'Health Policy', icon: InformationCircleIcon, color: 'gray' }
];

const MOCK_NEWS_DATA = [
  {
    _id: '1',
    title: 'Breakthrough in Type 2 Diabetes Treatment Shows 85% Success Rate',
    summary: 'New clinical trial results demonstrate remarkable effectiveness of combination therapy in reversing Type 2 diabetes symptoms.',
    content: 'A groundbreaking clinical trial involving 2,500 patients has shown that a novel combination therapy can reverse Type 2 diabetes symptoms in 85% of participants within 12 months. The treatment combines lifestyle intervention with targeted medication therapy.',
    category: 'research',
    tags: ['diabetes', 'clinical trial', 'treatment'],
    author: 'Dr. Sarah Johnson',
    source: 'Medical Journal Today',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    readTime: 4,
    priority: 'high',
    imageUrl: null,
    isBookmarked: false,
    views: 1247
  },
  {
    _id: '2',
    title: 'WHO Issues New Guidelines for Mental Health Screening',
    summary: 'World Health Organization updates global guidelines for early detection and intervention in mental health disorders.',
    content: 'The World Health Organization has released comprehensive new guidelines for mental health screening, emphasizing early detection and community-based interventions. The guidelines are expected to impact healthcare systems worldwide.',
    category: 'breaking',
    tags: ['WHO', 'mental health', 'guidelines'],
    author: 'Health News Network',
    source: 'WHO Press Release',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    readTime: 3,
    priority: 'urgent',
    imageUrl: null,
    isBookmarked: true,
    views: 3421
  },
  {
    _id: '3',
    title: 'Mediterranean Diet Reduces Heart Disease Risk by 40%',
    summary: 'Long-term study confirms significant cardiovascular benefits of Mediterranean dietary patterns.',
    content: 'A comprehensive 15-year study following 50,000 participants has confirmed that adherence to a Mediterranean diet reduces the risk of heart disease by 40%. The study highlights the importance of olive oil, fish, and vegetables.',
    category: 'nutrition',
    tags: ['mediterranean diet', 'heart disease', 'prevention'],
    author: 'Dr. Maria Rodriguez',
    source: 'Cardiology Research',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    readTime: 5,
    priority: 'medium',
    imageUrl: null,
    isBookmarked: false,
    views: 892
  },
  {
    _id: '4',
    title: 'AI-Powered Early Cancer Detection System Approved by FDA',
    summary: 'Revolutionary artificial intelligence system can detect cancer markers 3 years before traditional methods.',
    content: 'The FDA has approved an innovative AI-powered screening system that can identify cancer biomarkers up to 3 years before conventional diagnostic methods. Early trials show 94% accuracy in detection.',
    category: 'technology',
    tags: ['AI', 'cancer', 'early detection', 'FDA'],
    author: 'Tech Health Reporter',
    source: 'Medical Technology News',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    readTime: 6,
    priority: 'high',
    imageUrl: null,
    isBookmarked: false,
    views: 2156
  },
  {
    _id: '5',
    title: 'Exercise Prescription Programs Show Promise for Depression Treatment',
    summary: 'Structured exercise programs prove as effective as medication for mild to moderate depression.',
    content: 'New research demonstrates that structured exercise prescription programs can be as effective as antidepressant medications for treating mild to moderate depression, with fewer side effects.',
    category: 'mental_health',
    tags: ['exercise', 'depression', 'treatment'],
    author: 'Dr. Michael Chen',
    source: 'Journal of Mental Health',
    publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
    readTime: 4,
    priority: 'medium',
    imageUrl: null,
    isBookmarked: true,
    views: 756
  }
];

function HealthNews() {
  const [newsArticles, setNewsArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  // Load news articles
  useEffect(() => {
    fetchNews();
  }, [selectedCategory, bookmarkedOnly]);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const params = {
        limit: 20,
        sort: '-publishedAt'
      };
      
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      if (bookmarkedOnly) {
        params.bookmarked = true;
      }

      console.log('Fetching news with params:', params);
      
      // For now, use mock data since backend might not have news implemented yet
      let filteredNews = [...MOCK_NEWS_DATA];
      
      if (selectedCategory !== 'all') {
        filteredNews = filteredNews.filter(article => article.category === selectedCategory);
      }
      
      if (bookmarkedOnly) {
        filteredNews = filteredNews.filter(article => article.isBookmarked);
      }
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredNews = filteredNews.filter(article => 
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query) ||
          article.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      setNewsArticles(filteredNews);
      
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback to mock data on error
      setNewsArticles(MOCK_NEWS_DATA);
      toast.error('Using offline news data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchNews();
  };

  // Toggle bookmark
  const handleBookmark = async (articleId) => {
    try {
      // Update local state immediately for better UX
      setNewsArticles(prevArticles => 
        prevArticles.map(article => 
          article._id === articleId 
            ? { ...article, isBookmarked: !article.isBookmarked }
            : article
        )
      );
      
      // In a real implementation, this would call the API
      // await newsAPI.bookmarkArticle(articleId);
      
      const article = newsArticles.find(a => a._id === articleId);
      toast.success(article?.isBookmarked ? 'Bookmark removed' : 'Article bookmarked');
      
    } catch (error) {
      console.error('Bookmark error:', error);
      toast.error('Failed to update bookmark');
      
      // Revert the change on error
      setNewsArticles(prevArticles => 
        prevArticles.map(article => 
          article._id === articleId 
            ? { ...article, isBookmarked: !article.isBookmarked }
            : article
        )
      );
    }
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const articleDate = new Date(date);
    const diff = now - articleDate;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return articleDate.toLocaleDateString();
    }
  };

  // Get category info
  const getCategoryInfo = (categoryValue) => {
    return NEWS_CATEGORIES.find(cat => cat.value === categoryValue) || NEWS_CATEGORIES[0];
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get category color classes
  const getCategoryColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      teal: 'bg-teal-100 text-teal-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Health News
          </h1>
          <p className="text-lg text-gray-600">
            Stay updated with the latest health and medical news
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex gap-4">
            <button
              onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                bookmarkedOnly
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BookmarkIcon className="h-5 w-5 mr-2" />
              {bookmarkedOnly ? 'Show All' : 'Bookmarked Only'}
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              className="input"
              placeholder="Search health news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {NEWS_CATEGORIES.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center
                        ${selectedCategory === category.value
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                        }
                      `}
                    >
                      <IconComponent className="h-4 w-4 mr-2" />
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Breaking News</span>
                  <span className="text-sm font-medium text-red-600">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Research Updates</span>
                  <span className="text-sm font-medium text-blue-600">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Your Bookmarks</span>
                  <span className="text-sm font-medium text-gray-900">
                    {newsArticles.filter(a => a.isBookmarked).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - News Articles */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading latest health news...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {newsArticles.map((article) => {
                  const categoryInfo = getCategoryInfo(article.category);
                  const IconComponent = categoryInfo.icon;
                  
                  return (
                    <article key={article._id} className="card hover:shadow-lg transition-shadow">
                      {/* Article Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColorClasses(categoryInfo.color)}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColorClasses(categoryInfo.color)}`}>
                                {categoryInfo.label}
                              </span>
                              {article.priority && (
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(article.priority)}`}>
                                  {article.priority.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                              <span>{article.source}</span>
                              <span>•</span>
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {formatTimeAgo(article.publishedAt)}
                              </div>
                              <span>•</span>
                              <span>{article.readTime} min read</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Bookmark Button */}
                        <button
                          onClick={() => handleBookmark(article._id)}
                          className={`p-2 rounded-lg transition-colors ${
                            article.isBookmarked 
                              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          {article.isBookmarked ? (
                            <BookmarkSolidIcon className="h-5 w-5" />
                          ) : (
                            <BookmarkIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>

                      {/* Article Content */}
                      <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                          {article.title}
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-3">
                          {article.summary}
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          {article.content.length > 200 
                            ? `${article.content.substring(0, 200)}...` 
                            : article.content
                          }
                        </p>
                      </div>

                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {article.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                            >
                              <TagIcon className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Article Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>By {article.author}</span>
                          <span>•</span>
                          <span>{article.views} views</span>
                        </div>
                        
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Read Full Article →
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && newsArticles.length === 0 && (
              <div className="text-center py-12">
                <NewspaperIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No news articles found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedCategory !== 'all' || bookmarkedOnly
                    ? 'Try adjusting your search or filters' 
                    : 'Check back later for the latest health news'
                  }
                </p>
                {bookmarkedOnly && (
                  <button
                    onClick={() => setBookmarkedOnly(false)}
                    className="btn btn-primary"
                  >
                    Browse All News
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthNews;