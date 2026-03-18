# Direct Banana API test
$ErrorActionPreference = "Stop"

$apiKey = "sk-u6UD1x5HtFankIGczraMG0T8HFlyQGm3fHtIOZsp825f9Gbh"
$apiUrl = "https://api.vectorengine.ai"

# Minimal red pixel PNG
$validPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

$body = @{
    model = @{
        id = "gemini-2.5-pro"
        settings = @{
            max_tokens = 2048
            temperature = 0.7
        }
    }
    messages = @(
        @{
            role = "user"
            content = @(
                @{
                    type = "text"
                    text = "a modern building"
                }
                @{
                    type = "image_url"
                    image_url = @{
                        url = "data:image/png;base64,$validPng"
                    }
                }
            )
        }
    )
    stream = $false
} | ConvertTo-Json -Depth 5

Write-Host "Testing Banana API directly..."
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/v1/chat/completions" -Method POST -Body $body -ContentType "application/json" -Headers @{"Authorization"="Bearer $apiKey"}
    Write-Host "Success!"
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    $resp = $_.Exception.Response
    Write-Host "Status: $($resp.StatusCode) - $($resp.StatusDescription)"
}
