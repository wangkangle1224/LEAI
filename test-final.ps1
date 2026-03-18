# Simple test
$ErrorActionPreference = "Stop"

Write-Host "=== Testing LEAI Backend ==="

# 1. Demo login
Write-Host "`n1. Demo login..."
$loginResp = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/demo-login' -Method POST
$token = $loginResp.token
$user = $loginResp.user
Write-Host "   User: $($user.nickname)"
Write-Host "   Balance: $($user.balance)"

# 2. Test generate
Write-Host "`n2. Testing generate..."
$headers = @{Authorization="Bearer $token"}
$validPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
$body = @{
    prompt = "现代建筑渲染"
    image = $validPng
    model = "dall-e-3"
    resolution = "1K"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri 'http://localhost:3001/api/generate' -Method POST -Body $body -ContentType 'application/json' -Headers $headers
    Write-Host "   Success!"
    Write-Host ("   Response: " + ($result | ConvertTo-Json))
} catch {
    Write-Host "   Error: $_"
}

# 3. Check new balance
Write-Host "`n3. Checking new balance..."
$profile = Invoke-RestMethod -Uri 'http://localhost:3001/api/user/profile' -Headers $headers
Write-Host "   New Balance: $($profile.user.balance)"
