// Test the news service
import { fetchHealthNews } from './src/utils/newsService.js';

console.log('Testing news service...');

async function testNewsService() {
  try {
    console.log('Calling fetchHealthNews with default options...');
    const result = await fetchHealthNews({
      page: 1,
      pageSize: 5,
      category: 'all',
      searchQuery: ''
    });
    
    console.log('Result:', result);
    console.log('Success:', result.success);
    console.log('Articles count:', result.articles ? result.articles.length : 0);
    console.log('Articles:', result.articles);
    console.log('Source:', result.source);
    
    if (result.articles && result.articles.length > 0) {
      console.log('First article:', result.articles[0]);
    }
  } catch (error) {
    console.error('Error testing news service:', error);
  }
}

testNewsService();