#!/bin/bash

# MediSync News API Quick Setup Script
# Run this script after obtaining your API keys

echo "🔑 MediSync News API Setup"
echo "=========================="
echo ""

# Check if .env file exists
if [ ! -f "client/.env" ]; then
    echo "❌ .env file not found in client folder"
    echo "📝 Creating .env file from template..."
    cp client/.env.template client/.env
    echo "✅ Created client/.env file"
    echo ""
fi

echo "📋 Current .env configuration:"
echo "------------------------------"
grep "VITE_.*_API_KEY" client/.env || echo "No API keys configured yet"
echo ""

echo "🚀 Next Steps:"
echo "1. Edit client/.env file and add your API keys"
echo "2. Remove # from the beginning of the lines"
echo "3. Replace empty values with your actual keys"
echo "4. Restart your dev server: npm run dev"
echo ""

echo "📊 API Key Status Check:"
echo "------------------------"

# Check if NewsAPI key is configured
if grep -q "VITE_NEWS_API_KEY=.\+" client/.env; then
    echo "✅ NewsAPI key: Configured"
else
    echo "❌ NewsAPI key: Not configured"
    echo "   Get from: https://newsapi.org/register"
fi

# Check if GNews key is configured
if grep -q "VITE_GNEWS_API_KEY=.\+" client/.env; then
    echo "✅ GNews key: Configured"
else
    echo "❌ GNews key: Not configured"
    echo "   Get from: https://gnews.io/register"
fi

# Check if CurrentsAPI key is configured
if grep -q "VITE_CURRENTS_API_KEY=.\+" client/.env; then
    echo "✅ CurrentsAPI key: Configured"
else
    echo "❌ CurrentsAPI key: Not configured"
    echo "   Get from: https://currentsapi.services/en/register"
fi

echo ""
echo "💡 Minimum requirement: NewsAPI key (1,000 requests/day)"
echo "🔧 For help, see: NEWS_API_SETUP.md"