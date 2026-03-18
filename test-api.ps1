# Test Banana API
$ErrorActionPreference = "Continue"

# Login to get token
$loginResp = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/demo-login' -Method POST
$token = $loginResp.token

Write-Host "Login successful, token: $($token.Substring(0, 20))..."

# Test generate API
$body = @{
    prompt = "现代建筑渲染"
    image = "https://via.placeholder.com/512"
    model = "gemini-2.5-pro"
    resolution = "1024"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri 'http://localhost:3001/api/generate' -Method POST -Body $body -ContentType 'application/json' -Headers @{Authorization="Bearer $token"}
    Write-Host "Generate API Response:"
    Write-Host ($result | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "Error: $_"
    Write-Host "Response: $($_.Exception.Response)"
}
