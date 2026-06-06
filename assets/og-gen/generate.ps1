param()
$ErrorActionPreference = 'Stop'

$chromePaths = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
)
$chrome = $null
foreach ($p in $chromePaths) { if (Test-Path $p) { $chrome = $p; break } }
if (-not $chrome) { Write-Error "Chrome not found."; exit 1 }
Write-Host "Chrome: $chrome"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$assetsDir = Split-Path -Parent $scriptDir

$pages = @(
  @{ html = "og-naxos.html";   out = "og-naxos.jpg"   },
  @{ html = "og-paros.html";   out = "og-paros.jpg"   },
  @{ html = "og-mykonos.html"; out = "og-mykonos.jpg" },
  @{ html = "og-default.html"; out = "og-default.jpg" }
)

Add-Type -AssemblyName System.Drawing

foreach ($page in $pages) {
  $htmlPath = Join-Path $scriptDir $page.html
  $pngPath  = Join-Path $scriptDir ($page.html + ".png")
  $jpgPath  = Join-Path $assetsDir $page.out
  $fileUrl  = "file:///" + $htmlPath.Replace('\', '/')

  Write-Host "Processing $($page.html)..."
  $chromeArgs = @(
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--screenshot=$pngPath",
    "--window-size=1200,630",
    "--hide-scrollbars",
    $fileUrl
  )
  & $chrome @chromeArgs 2>$null
  Start-Sleep -Milliseconds 2000

  if (-not (Test-Path $pngPath)) {
    Write-Warning "Screenshot failed for $($page.html)"
    continue
  }

  $bitmap = [System.Drawing.Image]::FromFile($pngPath)
  $jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]90)
  $bitmap.Save($jpgPath, $jpegEncoder, $encParams)
  $bitmap.Dispose()

  $kb = [int]((Get-Item $jpgPath).Length / 1024)
  Write-Host "  Saved $($page.out) - $kb KB"
}

Write-Host "Done. Check assets/ for the new og-*.jpg files."