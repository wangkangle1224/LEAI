# Test DALL-E directly
$ErrorActionPreference = "Stop"

$apiKey = "sk-u6UD1x5HtFankIGczraMG0T8HFlyQGm3fHtIOZsp825f9Gbh"
$apiUrl = "https://api.vectorengine.ai"

$body = @{
    model = "dall-e-3"
    prompt = "a modern building"
    n = 1
    size = "1024x1024"
    quality = "standard"
} | ConvertTo-Json

Write-Host "Testing DALL-E 3 directly..."
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/v1/images/generations" -Method POST -Body $body -ContentType "application/json" -Headers @{"Authorization"="Bearer $apiKey"}
    Write-Host "Success!"
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    $resp = $_.Exception.Response
    Write-Host "Status: $($resp.StatusCode)"
}
