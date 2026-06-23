@echo off
setlocal

set "PORT=%~1"
if "%PORT%"=="" set "PORT=3000"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0restart.ps1" -Port %PORT%
