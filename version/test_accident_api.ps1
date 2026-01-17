# PowerShell script to test accident detection API
# This works with older PowerShell versions

$uri = "http://localhost:8000/accidents/detect"
$imagePath = "C:\Users\user\Desktop\roboflow\image.png"

# Read the file as bytes
$fileBytes = [System.IO.File]::ReadAllBytes($imagePath)
$fileName = [System.IO.Path]::GetFileName($imagePath)

# Create boundary for multipart form data
$boundary = [System.Guid]::NewGuid().ToString()

# Build the multipart form data body
$LF = "`r`n"
$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
    "Content-Type: image/png$LF",
    [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes),
    "--$boundary",
    "Content-Disposition: form-data; name=`"junction_id`"$LF",
    "J-001",
    "--$boundary",
    "Content-Disposition: form-data; name=`"save_to_db`"$LF",
    "true",
    "--$boundary--$LF"
) -join $LF

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyLines
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
