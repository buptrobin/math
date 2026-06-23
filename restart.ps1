param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$StopScript = Join-Path $ProjectRoot "scripts\stop.ps1"
$StartScript = Join-Path $ProjectRoot "scripts\start.ps1"

if (-not (Test-Path $StopScript)) {
  throw "Stop script not found: $StopScript"
}

if (-not (Test-Path $StartScript)) {
  throw "Start script not found: $StartScript"
}

Write-Host "Restarting math learning app on http://localhost:$Port ..."

& $StopScript -Port $Port
Start-Sleep -Seconds 1
& $StartScript -Port $Port

Write-Host "Restart command finished."
