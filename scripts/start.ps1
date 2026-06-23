param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$DataDir = Join-Path $ProjectRoot ".data"
$PidFile = Join-Path $DataDir "dev-server.pid"
$OutLogFile = Join-Path $DataDir "dev-server.out.log"
$ErrLogFile = Join-Path $DataDir "dev-server.err.log"

New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existing) {
  Write-Host "Server already appears to be running on http://localhost:$Port"
  Write-Host "Owning process id: $($existing.OwningProcess)"
  exit 0
}

if (Test-Path $PidFile) {
  $oldPid = Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($oldPid -and (Get-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue)) {
    Write-Host "Recorded server process is still running: $oldPid"
    Write-Host "Use scripts\stop.ps1 first if you want to restart it."
    exit 0
  }
  Remove-Item -LiteralPath $PidFile -Force
}

$npm = Get-Command npm.cmd -ErrorAction Stop
$arguments = @("run", "dev", "--", "--port", "$Port")
$process = Start-Process -FilePath $npm.Source -ArgumentList $arguments -WorkingDirectory $ProjectRoot -RedirectStandardOutput $OutLogFile -RedirectStandardError $ErrLogFile -WindowStyle Hidden -PassThru

Set-Content -Path $PidFile -Value $process.Id -Encoding ASCII

Write-Host "Started math learning app on http://localhost:$Port"
Write-Host "Process id: $($process.Id)"
Write-Host "Output log: $OutLogFile"
Write-Host "Error log: $ErrLogFile"
