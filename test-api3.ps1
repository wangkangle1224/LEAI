# Simple test with valid image
$ErrorActionPreference = "Stop"

Write-Host "=== Testing LEAI Backend with valid image ==="

# 1. Demo login
Write-Host "`n1. Demo login..."
$loginResp = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/demo-login' -Method POST
$token = $loginResp.token
$user = $loginResp.user
Write-Host "   User: $($user.nickname), Balance: $($user.balance)"

# 2. Test generate with valid base64 image (1x1 red pixel)
Write-Host "`n2. Testing generate with minimal valid image..."
$headers = @{Authorization="Bearer $token"}

# A minimal valid 1x1 red PNG in base64
$validPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

$body = @{
    prompt = "a modern building"
    image = $validPng
    model = "gemini-2.5-pro"
    resolution = "1K"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri 'http://localhost:3001/api/generate' -Method POST -Body $body -ContentType 'application/json' -Headers $headers
    Write-Host "   Success! New balance: $($result.data.balance)"
    Write-Host "   Image length: $($result.data.image.Length)"
} catch {
    $err = $_.Exception.Response
    $errMsg = $_.Exception.Message
    Write-Host "   Error: $errMsg"
}
