# Direct Banana API test - with image
$ErrorActionPreference = "Stop"

$apiKey = "sk-u6UD1x5HtFankIGczraMG0T8HFlyQGm3fHtIOZsp825f9Gbh"
$apiUrl = "https://api.vectorengine.ai"

# Test with image
$body = @{
    model = "gemini-2.5-pro"
    messages = @(
        @{
            role = "user"
            content = @(
                @{
                    type = "text"
                    text = "Describe this image"
                }
                @{
                    type = "image_url"
                    image_url = @{
                        url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                    }
                }
            )
        }
    )
    max_tokens = 500
} | ConvertTo-Json

Write-Host "Testing Banana API with image..."
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/v1/chat/completions" -Method POST -Body $body -ContentType "application/json" -Headers @{"Authorization"="Bearer $apiKey"}
    Write-Host "Success!"
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
