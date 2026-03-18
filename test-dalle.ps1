# Test with DALL-E
$ErrorActionPreference = "Stop"

Write-Host "=== Testing Banana API Image Generation ==="

# 1. Demo login
Write-Host "`n1. Demo login..."
$loginResp = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/demo-login' -Method POST
$token = $loginResp.token
$user = $loginResp.user
Write-Host "   User: $($user.nickname), Balance: $($user.balance)"

# 2. Test generate with DALL-E 3
Write-Host "`n2. Testing generate with dall-e-3..."
$headers = @{Authorization="Bearer $token"}
$body = @{
    prompt = "a modern building with glass windows"
    image = ""
    model = "dall-e-3"
    resolution = "1K"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri 'http://localhost:3001/api/generate' -Method POST -Body $body -ContentType 'application/json' -Headers $headers
    Write-Host "   Success!"
    if ($result.success) {
        Write-Host "   Image length: $($result.data.image.Length)"
        Write-Host "   New balance: $($result.data.balance)"
        Write-Host "   Cost: $($result.data.cost)"
    } else {
        Write-Host "   Error: $($result.error.message)"
    }
} catch {
    Write-Host "   Error: $($_.Exception.Message)"
}
