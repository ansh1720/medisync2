# Clean all remaining dark mode classes from DynamicWidgets.jsx
$filePath = "client/src/components/DynamicWidgets.jsx"
$content = Get-Content $filePath -Raw

# Replace all dark mode classes with theme classes
$content = $content -replace 'bg-white dark:bg-gray-800', 'bg-card'
$content = $content -replace 'text-gray-900 dark:text-white', 'text-card-foreground'
$content = $content -replace 'text-gray-600 dark:text-gray-400', 'text-muted-foreground'
$content = $content -replace 'text-gray-700 dark:text-gray-300', 'text-muted-foreground'
$content = $content -replace 'text-gray-500 dark:text-gray-400', 'text-muted-foreground'
$content = $content -replace 'bg-gray-50 dark:bg-gray-700', 'bg-muted'
$content = $content -replace 'text-gray-300 dark:text-gray-600', 'text-muted-foreground'
$content = $content -replace 'text-gray-400 dark:text-gray-500', 'text-muted-foreground'
$content = $content -replace 'text-yellow-500 dark:text-yellow-400', 'text-warning'
$content = $content -replace 'text-purple-600 dark:text-purple-400', 'text-primary'
$content = $content -replace 'border-purple-100 dark:border-purple-800', 'border-primary/20'
$content = $content -replace 'hover:border-purple-300 dark:hover:border-purple-600', 'hover:border-primary/40'

# Remove any remaining dark: classes
$content = $content -replace '\s+dark:[a-zA-Z0-9\-\[\]\/\{\}\.]+', ''

Set-Content $filePath $content

Write-Host "Cleaned all dark mode classes from DynamicWidgets.jsx"