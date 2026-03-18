# Direct Banana API test - text only
$ErrorActionPreference = "Stop"

$apiKey = "sk-u6UD1x5HtFankIGczraMG0T8HFlyQGm3fHtIOZsp825f9Gbh"
$apiUrl = "https://api.vectorengine.ai"

# Test with just text (no image)
$body = @{
    model = "gemini-2.5-pro"
    messages = @(
        @{
            role = "user"
            content = "Hello, how are you?"
        }
    )
    stream = $false
} | ConvertTo-Json

Write-Host "Testing Banana API with text only..."
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/v1/chat/completions" -Method POST -Body $body -ContentType "application/json" -Headers @{"Authorization"="Bearer $apiKey"}
    Write-Host "Success!"
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
