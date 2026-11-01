param(
    [Parameter(Mandatory=$false)]
    [string]$Port
)

$adb = "C:\Users\user\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$apk = "C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\Semestero-Wear.apk"
$watchIp = "10.0.0.14"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "⌚ Semestero ME • Galaxy Watch 8 Wireless Installer" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $apk)) {
    Write-Host "❌ Error: APK not found at $apk" -ForegroundColor Red
    exit 1
}

if (-not $Port) {
    Write-Host "`n👀 On your Galaxy Watch:" -ForegroundColor Yellow
    Write-Host "   Go back to the main 'Wireless debugging' screen (where the toggle is ON)."
    Write-Host "   Look at the port displayed under 'IP address & Port' (e.g. 10.0.0.14:XXXXX)."
    $Port = Read-Host "`n👉 Enter the 5-digit port (XXXXX)"
}

$target = "$($watchIp):$($Port.Trim())"
Write-Host "`n🔄 Connecting to Galaxy Watch at $target..." -ForegroundColor Cyan
& $adb connect $target

Start-Sleep -Seconds 1
$devices = & $adb devices
Write-Host $devices

if ($devices -match $watchIp) {
    Write-Host "`n🚀 Installing Semestero-Wear.apk onto Galaxy Watch 8..." -ForegroundColor Green
    & $adb -s $target install -r $apk
    Write-Host "`n🎉 Installation complete! The watch app and tile are updated." -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Failed to connect to $target. Ensure Wireless Debugging is ON on the watch." -ForegroundColor Red
}
