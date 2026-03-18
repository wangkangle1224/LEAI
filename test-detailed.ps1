# Test with detailed logging
$ErrorActionPreference = "Stop"

Write-Host "=== Detailed Test ==="

# 1. Demo login
Write-Host "`n1. Login..."
$loginResp = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/demo-login' -Method POST
$token = $loginResp.token

# 2. Test generate with more detailed logging
Write-Host "`n2. Generate..."
$headers = @{
    Authorization="Bearer $token"
    "Content-Type"="application/json"
}

# Use an empty string for image (text-to-image)
$body = @{
    prompt = "现代建筑渲染"
    image = ""
    model = "dall-e-3"
    resolution = "1K"
} | ConvertTo-Json -Depth 3

Write-Host "Request body: $body"

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/generate' -Method POST -Body $body -ContentType 'application/json' -Headers $headers
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}
