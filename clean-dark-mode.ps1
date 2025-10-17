# Clean dark mode from DynamicWidgets.jsx
$filePath = "client/src/components/DynamicWidgets.jsx"
$content = Get-Content $filePath -Raw

# Remove all dark: classes with various patterns
$content = $content -replace '\s+dark:[a-zA-Z0-9\-\[\]\/\{\}\.]+', ''

# Clean up extra spaces
$content = $content -replace '\s+', ' '
$content = $content -replace '\s+\}', '}'
$content = $content -replace '\{\s+', '{'

Set-Content $filePath $content

Write-Host "Cleaned dark mode classes from DynamicWidgets.jsx"