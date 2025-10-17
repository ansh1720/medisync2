# MediSync News API Quick Setup Script (PowerShell)
# Run this script after obtaining your API keys

Write-Host "🔑 MediSync News API Setup" -ForegroundColor Cyan
Write-Host "=========================="
Write-Host ""

# Check if .env file exists
if (!(Test-Path "client\.env")) {
    Write-Host "❌ .env file not found in client folder" -ForegroundColor Red
    Write-Host "📝 Creating .env file from template..."
    Copy-Item "client\.env.template" "client\.env"
    Write-Host "✅ Created client\.env file" -ForegroundColor Green
    Write-Host ""
}

Write-Host "📋 Current .env configuration:"
Write-Host "------------------------------"
$envContent = Get-Content "client\.env" | Select-String "VITE_.*_API_KEY"
if ($envContent) {
    $envContent | ForEach-Object { Write-Host $_.Line }
} else {
    Write-Host "No API keys configured yet"
}
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Edit client\.env file and add your API keys"
Write-Host "2. Remove # from the beginning of the lines"
Write-Host "3. Replace empty values with your actual keys"
Write-Host "4. Restart your dev server: npm run dev"
Write-Host ""

Write-Host "📊 API Key Status Check:" -ForegroundColor Yellow
Write-Host "------------------------"

# Check if NewsAPI key is configured
$newsApiKey = Get-Content "client\.env" | Select-String "VITE_NEWS_API_KEY=.+"
if ($newsApiKey) {
    Write-Host "✅ NewsAPI key: Configured" -ForegroundColor Green
} else {
    Write-Host "❌ NewsAPI key: Not configured" -ForegroundColor Red
    Write-Host "   Get from: https://newsapi.org/register"
}

# Check if GNews key is configured
$gnewsKey = Get-Content "client\.env" | Select-String "VITE_GNEWS_API_KEY=.+"
if ($gnewsKey) {
    Write-Host "✅ GNews key: Configured" -ForegroundColor Green
} else {
    Write-Host "❌ GNews key: Not configured" -ForegroundColor Red
    Write-Host "   Get from: https://gnews.io/register"
}

# Check if CurrentsAPI key is configured
$currentsKey = Get-Content "client\.env" | Select-String "VITE_CURRENTS_API_KEY=.+"
if ($currentsKey) {
    Write-Host "✅ CurrentsAPI key: Configured" -ForegroundColor Green
} else {
    Write-Host "❌ CurrentsAPI key: Not configured" -ForegroundColor Red
    Write-Host "   Get from: https://currentsapi.services/en/register"
}

Write-Host ""
Write-Host "💡 Minimum requirement: NewsAPI key (1,000 requests/day)" -ForegroundColor Cyan
Write-Host "🔧 For help, see: NEWS_API_SETUP.md" -ForegroundColor Cyan

# Option to open registration pages
Write-Host ""
$openPages = Read-Host "Would you like to open the API registration pages? (y/n)"
if ($openPages -eq 'y' -or $openPages -eq 'Y') {
    Write-Host "🌐 Opening registration pages..."
    Start-Process "https://newsapi.org/register"
    Start-Sleep 2
    Start-Process "https://gnews.io/register"
    Start-Sleep 2
    Start-Process "https://currentsapi.services/en/register"
}