@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1

:: ══════════════════════════════════════════════════════════════════════════════
::  🐸 Tadpole Bridge — Quick Start (Windows)
::  Starts the bridge server and shows connection info.
:: ══════════════════════════════════════════════════════════════════════════════

title Tadpole Bridge Server

:: ── Colours ──────────────────────────────────────────────────────────────────
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "GREEN=!ESC![92m"
set "CYAN=!ESC![96m"
set "RED=!ESC![91m"
set "YELLOW=!ESC![93m"
set "BOLD=!ESC![1m"
set "DIM=!ESC![2m"
set "RESET=!ESC![0m"

:: ── Resolve bridge directory ────────────────────────────────────────────────
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "BRIDGE_DIR=%SCRIPT_DIR%\..\bridge"
for %%I in ("%BRIDGE_DIR%") do set "BRIDGE_DIR=%%~fI"

:: ── Check Node.js ───────────────────────────────────────────────────────────
where node >nul 2>&1
if !errorlevel! neq 0 (
    echo.
    echo  !RED![FAIL] Node.js is not installed or not in PATH.!RESET!
    echo         Please install Node.js from https://nodejs.org/
    echo         Then run this script again.
    echo.
    pause
    exit /b 1
)

:: ── Check bridge exists ─────────────────────────────────────────────────────
if not exist "%BRIDGE_DIR%\server.js" (
    echo.
    echo  [FAIL] Bridge server not found at: %BRIDGE_DIR%\server.js
    echo         Please run install-windows.bat first.
    echo.
    pause
    exit /b 1
)

:: ── Install deps if needed ──────────────────────────────────────────────────
if not exist "%BRIDGE_DIR%\node_modules" (
    echo  Installing bridge dependencies...
    cd /d "%BRIDGE_DIR%"
    call npm install --production
)

:: ── Get IP ──────────────────────────────────────────────────────────────────
set "LAN_IP="
for /F "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /V "0.0.0.0"') do (
    for /F "tokens=1" %%b in ("%%a") do (
        if not defined LAN_IP set "LAN_IP=%%b"
    )
)
if not defined LAN_IP set "LAN_IP=localhost"

:: ── Show banner ──────────────────────────────────────────────────────────────
echo.
echo   ╔══════════════════════════════════════════════════════════════╗
echo   !BOLD!   🐸  Tadpole Bridge Server!RESET!
echo   ╠══════════════════════════════════════════════════════════════╣
echo   !DIM!   Bridge:    !RESET!!CYAN!http://!LAN_IP!:3456!RESET!
echo   !DIM!   WebSocket: !RESET!!CYAN!ws://!LAN_IP!:3456/ws!RESET!
echo   ╠══════════════════════════════════════════════════════════════╣
echo   !BOLD!   Phone App: https://tadpole-omega.vercel.app!RESET!
echo   !BOLD!   Enter IP:  !LAN_IP!:3456!RESET!
echo   ╠══════════════════════════════════════════════════════════════╣
echo.
echo   !DIM! Open the URL above on your phone and enter the IP address.!RESET!
echo   !DIM! Both devices must be on the same WiFi network.!RESET!
echo   !DIM! Press Ctrl+C to stop the server.!RESET!
echo.
echo   ╚══════════════════════════════════════════════════════════════╝
echo.

:: ── Start server ─────────────────────────────────────────────────────────────
cd /d "%BRIDGE_DIR%"
node server.js
