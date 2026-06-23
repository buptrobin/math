param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$PidFile = Join-Path $ProjectRoot ".data\dev-server.pid"

function Stop-ServerProcess {
  param([int]$ProcessId)

  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if (-not $process) {
    return $false
  }

  Stop-Process -Id $ProcessId -Force
  Write-Host "Stopped process $ProcessId"
  return $true
}

$stopped = $false

if (Test-Path $PidFile) {
  $recordedPid = Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($recordedPid) {
    $stopped = Stop-ServerProcess -ProcessId ([int]$recordedPid)
  }
  Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
}

$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
foreach ($connection in $connections) {
  $stopped = (Stop-ServerProcess -ProcessId $connection.OwningProcess) -or $stopped
}

if ($stopped) {
  Write-Host "Server on port $Port has been stopped."
} else {
  Write-Host "No running server found on port $Port."
}
