# Test with error capture
$ErrorActionPreference = "Stop"

Write-Host "=== Test with Error Capture ==="

# 1. Login
$loginResp = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/demo-login' -Method POST
$token = $loginResp.token

# 2. Test generate
$headers = @{
    Authorization="Bearer $token"
    "Content-Type"="application/json"
}

$body = @{
    prompt = "modern building"
    image = ""
    model = "dall-e-3"
    resolution = "1K"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/generate' -Method POST -Body $body -ContentType 'application/json' -Headers $headers
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    $err = $_.Exception
    Write-Host "Error Message: $($err.Message)"
    # Try to get response body
    if ($err.Response) {
        $reader = New-Object System.IO.StreamReader($err.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "Response Body: $responseBody"
    }
}
