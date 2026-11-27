$ErrorActionPreference = "Stop"
$RepoDir = Split-Path -Parent $PSScriptRoot
$ZipUrl = "https://github.com/adir2368/Semestero-ME/releases/latest/download/Semestero-ME-Windows-x64.zip"
$TempZip = Join-Path $env:TEMP "Semestero-ME-Windows-x64.zip"
$DistDir = Join-Path $RepoDir "dist"

Write-Host "Stopping running Semestero ME / Electron instances..." -ForegroundColor Cyan
Stop-Process -Name "Semestero ME", "electron" -Force -ErrorAction SilentlyContinue

Write-Host "Downloading latest Electron Windows x64 build from GitHub Releases..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $ZipUrl -OutFile $TempZip -UseBasicParsing

if (-not (Test-Path $DistDir)) { New-Item -ItemType Directory -Path $DistDir | Out-Null }
$TargetDir = Join-Path $DistDir "Semestero ME-win32-x64"
if (Test-Path $TargetDir) { Remove-Item -Recurse -Force $TargetDir }

Write-Host "Extracting to $DistDir..." -ForegroundColor Cyan
Expand-Archive -Path $TempZip -DestinationPath $DistDir -Force
Copy-Item -Path (Join-Path $TargetDir "Semestero ME.exe") -Destination (Join-Path $RepoDir "Semestero-ME.exe") -Force
Remove-Item -Path $TempZip -Force -ErrorAction SilentlyContinue

Write-Host "Electron desktop app updated successfully!" -ForegroundColor Green
