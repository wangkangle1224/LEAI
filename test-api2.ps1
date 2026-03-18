# Simple test
$ErrorActionPreference = "Stop"

Write-Host "=== Testing LEAI Backend ==="

# 1. Check health
Write-Host "`n1. Checking health..."
try {
    $health = Invoke-RestMethod -Uri 'http://localhost:3001/health'
    Write-Host "   Status: $($health.status)"
} catch {
    Write-Host "   Error: $_"
}

# 2. Demo login
Write-Host "`n2. Demo login..."
$loginResp = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/demo-login' -Method POST
$token = $loginResp.token
$user = $loginResp.user
Write-Host "   User: $($user.nickname)"
Write-Host "   Balance: $($user.balance)"
Write-Host "   VIP: $($user.isVip)"

# 3. Check profile
Write-Host "`n3. Getting profile..."
$headers = @{Authorization="Bearer $token"}
$profile = Invoke-RestMethod -Uri 'http://localhost:3001/api/user/profile' -Headers $headers
Write-Host "   Profile Balance: $($profile.user.balance)"

# 4. Test generate (small test)
Write-Host "`n4. Testing generate..."
$body = @{
    prompt = "建筑渲染"
    image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    model = "gemini-2.5-pro"
    resolution = "1K"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri 'http://localhost:3001/api/generate' -Method POST -Body $body -ContentType 'application/json' -Headers $headers
    Write-Host "   Success! New balance: $($result.data.balance)"
} catch {
    $err = $_.Exception.Response
    Write-Host "   Error: $($err.StatusCode) - $($err.StatusDescription)"
}
