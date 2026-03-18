# Test nano-banana directly
$ErrorActionPreference = "Stop"

$apiKey = "sk-u6UD1x5HtFankIGczraMG0T8HFlyQGm3fHtIOZsp825f9Gbh"
$apiUrl = "https://api.vectorengine.ai"

# Test with nano-banana
$body = @{
    model = "nano-banana"
    messages = @(
        @{
            role = "user"
            content = "Describe this image"
        }
    )
    stream = $false
} | ConvertTo-Json

Write-Host "Testing nano-banana..."
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/v1/chat/completions" -Method POST -Body $body -ContentType "application/json" -Headers @{"Authorization"="Bearer $apiKey"}
    Write-Host "Success!"
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
