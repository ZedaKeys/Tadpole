@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1

:: ══════════════════════════════════════════════════════════════════════════════
::  🐸 Tadpole BG3 Companion — Windows Installer
::  Idempotent: safe to run multiple times.
:: ══════════════════════════════════════════════════════════════════════════════

title Tadpole Installer

:: ── Colours (ANSI escape codes — works on Windows 10+) ──────────────────────
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "GREEN=!ESC![92m"
set "RED=!ESC![91m"
set "YELLOW=!ESC![93m"
set "CYAN=!ESC![96m"
set "BOLD=!ESC![1m"
set "DIM=!ESC![2m"
set "RESET=!ESC![0m"

set "OK=!GREEN![OK]!RESET!"
set "FAIL=!RED![FAIL]!RESET!"
set "WARN=!YELLOW![WARN]!RESET!"
set "INFO=!CYAN>[INFO]!RESET!"

:: ── Banner ───────────────────────────────────────────────────────────────────
echo.
echo  !BOLD!🐸  Tadpole BG3 Companion — Installer!RESET!
echo  ────────────────────────────────────────────────
echo.

:: ── Script directory (wherever this .bat lives) ─────────────────────────────
set "SCRIPT_DIR=%~dp0"
:: Strip trailing backslash
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
:: Project root is one level up from install/
set "PROJECT_ROOT=%SCRIPT_DIR%\.."

:: Resolve to absolute paths
for %%I in ("%PROJECT_ROOT%") do set "PROJECT_ROOT=%%~fI"

set "MOD_SRC=%PROJECT_ROOT%\mod\TadpoleCompanion.lua"
set "BRIDGE_DIR=%PROJECT_ROOT%\bridge"

:: ── Step 0: Validate source files exist ──────────────────────────────────────
echo  !INFO! Checking installer source files...

if not exist "%MOD_SRC%" (
    echo  !FAIL! TadpoleCompanion.lua not found at:
    echo         %MOD_SRC%
    echo.
    echo         Make sure you cloned the full Tadpole repository.
    goto :error_exit
)
echo  !OK! TadpoleCompanion.lua found

if not exist "%BRIDGE_DIR%\server.js" (
    echo  !FAIL! Bridge server not found at:
    echo         %BRIDGE_DIR%\server.js
    goto :error_exit
)
echo  !OK! Bridge server found

:: ── Step 1: Detect BG3 install path ─────────────────────────────────────────
echo.
echo  !INFO! Step 1: Detecting Baldur's Gate 3 installation...

set "BG3_PATH="

:: Method A: Check Steam library paths via registry
for %%K in ("HKLM\SOFTWARE\WOW6432Node\Valve\Steam" "HKCU\SOFTWARE\Valve\Steam" "HKLM\SOFTWARE\Valve\Steam") do (
    if not defined BG3_PATH (
        for /F "tokens=2*" %%A in ('reg query %%K /v InstallPath 2^>nul ^| findstr InstallPath') do (
            set "STEAM_INSTALL=%%B"
            if exist "!STEAM_INSTALL!\steamapps\common\Baldurs Gate 3" (
                set "BG3_PATH=!STEAM_INSTALL!\steamapps\common\Baldurs Gate 3"
            )
        )
    )
)

:: Method B: Common Steam locations
if not defined BG3_PATH (
    for %%D in (
        "C:\Program Files (x86)\Steam\steamapps\common\Baldurs Gate 3"
        "C:\Program Files\Steam\steamapps\common\Baldurs Gate 3"
        "D:\Steam\steamapps\common\Baldurs Gate 3"
        "D:\SteamLibrary\steamapps\common\Baldurs Gate 3"
        "E:\Steam\steamapps\common\Baldurs Gate 3"
        "E:\SteamLibrary\steamapps\common\Baldurs Gate 3"
    ) do (
        if not defined BG3_PATH (
            if exist %%D set "BG3_PATH=%%~D"
        )
    )
)

:: Method C: Parse steamapps/libraryfolders.vdf
if not defined BG3_PATH (
    for %%K in ("HKLM\SOFTWARE\WOW6432Node\Valve\Steam" "HKCU\SOFTWARE\Valve\Steam") do (
        if not defined BG3_PATH (
            for /F "tokens=2*" %%A in ('reg query %%K /v InstallPath 2^>nul ^| findstr InstallPath') do (
                set "STEAM_INSTALL=%%B"
                if exist "!STEAM_INSTALL!\steamapps\libraryfolders.vdf" (
                    for /F "tokens=2 delims=]" %%P in ('type "!STEAM_INSTALL!\steamapps\libraryfolders.vdf" ^| findstr /i "path"') do (
                        set "LIBPATH=%%P"
                        set "LIBPATH=!LIBPATH:"=!"
                        set "LIBPATH=!LIBPATH:\\=/!"
                        set "LIBPATH=!LIBPATH:/=\!"
                        if exist "!LIBPATH!\steamapps\common\Baldurs Gate 3" (
                            set "BG3_PATH=!LIBPATH!\steamapps\common\Baldurs Gate 3"
                        )
                    )
                )
            )
        )
    )
)

:: Method D: Check GOG Galaxy registry
if not defined BG3_PATH (
    for %%K in ("HKLM\SOFTWARE\WOW6432Node\GOG.com\Games\1452983930" "HKLM\SOFTWARE\GOG.com\Games\1452983930" "HKCU\SOFTWARE\GOG.com\Games\1452983930") do (
        if not defined BG3_PATH (
            for /F "tokens=2*" %%A in ('reg query %%K /v PATH 2^>nul ^| findstr PATH') do (
                if exist "%%B" set "BG3_PATH=%%B"
            )
        )
    )
)

:: Method D2: Check GOG common install paths (may include apostrophe)
if not defined BG3_PATH (
    for %%D in (
        "C:\GOG Games\Baldur's Gate 3"
        "D:\GOG Games\Baldur's Gate 3"
        "C:\Games\Baldur's Gate 3"
        "D:\Games\Baldur's Gate 3"
    ) do (
        if not defined BG3_PATH (
            if exist %%D set "BG3_PATH=%%~D"
        )
    )
)

:: Method E: Check Xbox Game Pass / Microsoft Store (UWP appx)
if not defined BG3_PATH (
    powershell -NoProfile -Command ^
        "$pkg = Get-AppxPackage -Name '*BaldursGate3*' -ErrorAction SilentlyContinue | Select-Object -First 1;" ^
        "if ($pkg) {" ^
        "  $installLoc = $pkg.InstallLocation;" ^
        "  if ($installLoc -and (Test-Path $installLoc)) {" ^
        "    Write-Output $installLoc;" ^
        "  }" ^
        "}" 2>nul > "%TEMP%\tadpole_xbox_path.tmp"
    if exist "%TEMP%\tadpole_xbox_path.tmp" (
        for /F "usebackq tokens=*" %%P in ("%TEMP%\tadpole_xbox_path.tmp") do (
            if not defined BG3_PATH (
                if exist "%%P" set "BG3_PATH=%%P"
            )
        )
        del "%TEMP%\tadpole_xbox_path.tmp" 2>nul
    )
)

:: Method F: Ask the user
if not defined BG3_PATH (
    echo  !WARN! Could not auto-detect BG3 install path.
    echo.
    set /p "BG3_PATH=  Please enter your BG3 install folder path: "
    if not exist "!BG3_PATH!" (
        echo  !FAIL! Path does not exist: !BG3_PATH!
        goto :error_exit
    )
)

echo  !OK! BG3 found at: !BG3_PATH!

:: ── Step 2: Check / Install BG3 ScriptExtender ─────────────────────────────
echo.
echo  !INFO! Step 2: Checking BG3 ScriptExtender...

set "SE_DLL=!BG3_PATH!\DWrite.dll"
set "SE_INSTALLED=0"

if exist "!SE_DLL!" (
    echo  !OK! BG3 ScriptExtender is installed (DWrite.dll found)
    set "SE_INSTALLED=1"
) else (
    echo  !WARN! BG3 ScriptExtender not found.
    echo         Downloading from GitHub releases...
    
    :: Try with PowerShell
    powershell -NoProfile -Command ^
        "try {" ^
        "  $releases = Invoke-RestMethod 'https://api.github.com/repos/Norbyte/bg3se/releases/latest';" ^
        "  $asset = $releases.assets | Where-Object { $_.name -like '*ScriptExtender*' -and $_.name -like '*.zip' } | Select-Object -First 1;" ^
        "  if (-not $asset) { $asset = $releases.assets | Where-Object { $_.name -like '*.zip' } | Select-Object -First 1 };" ^
        "  if ($asset) {" ^
        "    Write-Host '  Downloading: ' $asset.name;" ^
        "    $tmpZip = [System.IO.Path]::Combine($env:TEMP, 'bg3se.zip');" ^
        "    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $tmpZip -UseBasicParsing;" ^
        "    Write-Host '  Extracting to: ' '!BG3_PATH!';" ^
        "    Expand-Archive -Path $tmpZip -DestinationPath '!BG3_PATH!' -Force;" ^
        "    Remove-Item $tmpZip -Force;" ^
        "    Write-Host '  ScriptExtender installed successfully';" ^
        "    exit 0;" ^
        "  } else {" ^
        "    Write-Host '  Could not find a release asset to download';" ^
        "    exit 1;" ^
        "  }" ^
        "} catch {" ^
        "  Write-Host '  Download failed: ' $_.Exception.Message;" ^
        "  exit 1;" ^
        "}"
    
    if !errorlevel! equ 0 (
        echo  !OK! BG3 ScriptExtender downloaded and installed
        set "SE_INSTALLED=1"
    ) else (
        echo  !WARN! Automatic download failed.
        echo.
        echo         Please install BG3 ScriptExtender manually:
        echo         1. Go to https://github.com/Norbyte/bg3se/releases/latest
        echo         2. Download the latest release zip
        echo         3. Extract DWrite.dll into your BG3 folder:
        echo            !BG3_PATH!
        echo         4. Run this installer again.
        echo.
        choice /C YN /M "  Continue anyway? (bridge server can still be installed)"
        if !errorlevel! equ 2 goto :error_exit
    )
)

:: ── Step 3: Install TadpoleCompanion.lua mod ────────────────────────────────
echo.
echo  !INFO! Step 3: Installing Tadpole Lua mod...

:: Determine the LuaScripts path
:: BG3SE loads from: <BG3>/bin/LuaScripts/  OR  %LOCALAPPDATA%\Larian Studios\Baldur's Gate 3\ScriptExtender\LuaScripts\
set "LUA_DIR=!BG3_PATH!\bin\LuaScripts"
if not exist "!LUA_DIR!" (
    set "LUA_DIR=%LOCALAPPDATA%\Larian Studios\Baldur's Gate 3\ScriptExtender\LuaScripts"
)

:: Create directory if needed
if not exist "!LUA_DIR!" (
    mkdir "!LUA_DIR!" 2>nul
    if !errorlevel! neq 0 (
        echo  !FAIL! Could not create directory: !LUA_DIR!
        echo         Try running as Administrator.
        goto :error_exit
    )
)

:: Copy the mod file (always overwrite to ensure latest version)
copy /Y "%MOD_SRC%" "!LUA_DIR!\TadpoleCompanion.lua" >nul 2>&1
if !errorlevel! equ 0 (
    echo  !OK! TadpoleCompanion.lua installed to:
    echo         !LUA_DIR!
) else (
    echo  !FAIL! Could not copy mod file. Try running as Administrator.
    goto :error_exit
)

:: ── Step 4: Check / Install Node.js ─────────────────────────────────────────
echo.
echo  !INFO! Step 4: Checking Node.js...

set "NODE_OK=0"
where node >nul 2>&1
if !errorlevel! equ 0 (
    for /F "tokens=*" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
    :: Validate minimum version (v18+)
    set "NODE_MAJOR=!NODE_VER:v=!"
    for /F "delims=." %%m in ("!NODE_MAJOR!") do set "NODE_MAJOR=%%m"
    if !NODE_MAJOR! geq 18 (
        echo  !OK! Node.js !NODE_VER! found
        set "NODE_OK=1"
    ) else (
        echo  !WARN! Node.js !NODE_VER! found but v18+ is required.
        echo         Attempting to upgrade via winget...
    )
)
if "!NODE_OK!"=="0" (
    echo  !WARN! Node.js not found or too old.
    echo         Attempting to install via winget...
    
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements >nul 2>&1
    if !errorlevel! equ 0 (
        :: Refresh PATH for the current session
        set "PATH=%PATH%;C:\Program Files\nodejs"
        where node >nul 2>&1
        if !errorlevel! equ 0 (
            for /F "tokens=*" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
            echo  !OK! Node.js !NODE_VER! installed via winget
            set "NODE_OK=1"
        )
    )
    
    if "!NODE_OK!"=="0" (
        echo  !WARN! winget install failed or not available.
        echo.
        echo         Please install Node.js manually:
        echo         Download from: https://nodejs.org/
        echo         Choose the LTS version, then re-run this installer.
        echo.
        choice /C YN /M "  Continue anyway? (bridge won't work without Node.js)"
        if !errorlevel! equ 2 goto :error_exit
    )
)

:: ── Step 5: Install bridge server dependencies ──────────────────────────────
echo.
echo  !INFO! Step 5: Installing bridge server dependencies...

cd /d "%BRIDGE_DIR%"
call npm install --production 2>nul
if !errorlevel! equ 0 (
    echo  !OK! Bridge dependencies installed
) else (
    echo  !FAIL! npm install failed. Check your Node.js installation.
    goto :error_exit
)

:: ── Step 6: Create desktop shortcut ─────────────────────────────────────────
echo.
echo  !INFO! Step 6: Creating desktop shortcut...

set "SHORTCUT_PATH=%USERPROFILE%\Desktop\Tadpole Bridge.lnk"

:: Build the command to start the bridge in a new window that stays open
set "START_CMD=cmd /k "cd /d "%BRIDGE_DIR%" && node server.js""

powershell -NoProfile -Command ^
    "$ws = New-Object -ComObject WScript.Shell;" ^
    "$sc = $ws.CreateShortcut('!SHORTCUT_PATH!');" ^
    "$sc.TargetPath = 'cmd.exe';" ^
    "$sc.Arguments = '/k \"cd /d \"!BRIDGE_DIR!\" && node server.js\"';" ^
    "$sc.WorkingDirectory = '!BRIDGE_DIR!';" ^
    "$sc.Description = 'Tadpole BG3 Bridge Server';" ^
    "$sc.IconLocation = 'cmd.exe,0';" ^
    "$sc.Save();" ^
    "Write-Host 'Shortcut created'"

if exist "!SHORTCUT_PATH!" (
    echo  !OK! Desktop shortcut created: Tadpole Bridge
) else (
    echo  !WARN! Could not create desktop shortcut (non-critical)
)

:: ── Step 7: Add firewall rule ───────────────────────────────────────────────
echo.
echo  !INFO! Step 7: Configuring Windows Firewall for port 3456...

:: Check if rule already exists
netsh advfirewall firewall show rule name="Tadpole Bridge (TCP 3456)" >nul 2>&1
if !errorlevel! equ 0 (
    echo  !OK! Firewall rule already exists
) else (
    netsh advfirewall firewall add rule ^
        name="Tadpole Bridge (TCP 3456)" ^
        dir=in ^
        action=allow ^
        protocol=tcp ^
        localport=3456 ^
        profile=private ^
        description="Allow Tadpole phone app to connect to bridge server" >nul 2>&1
    
    if !errorlevel! equ 0 (
        echo  !OK! Firewall rule added for port 3456 (Private network)
    ) else (
        echo  !WARN! Could not add firewall rule. Try running as Administrator.
        echo         You may need to manually allow port 3456 in Windows Firewall.
    )
)

:: ── Step 8: Get IP address ──────────────────────────────────────────────────
echo.
echo  !INFO! Step 8: Detecting your local IP address...

set "LAN_IP="
for /F "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /V "0.0.0.0"') do (
    for /F "tokens=1" %%b in ("%%a") do (
        if not defined LAN_IP set "LAN_IP=%%b"
    )
)

if not defined LAN_IP (
    set "LAN_IP=localhost"
    echo  !WARN! Could not auto-detect IP. Using localhost.
) else (
    echo  !OK! Your IP: !LAN_IP!
)

:: ── Done! ────────────────────────────────────────────────────────────────────
echo.
echo  ════════════════════════════════════════════════════════════════
echo  !BOLD!  🎉  Installation Complete!!RESET!
echo  ════════════════════════════════════════════════════════════════
echo.
echo  !BOLD!Next steps:!RESET!
echo.
echo  1. Start BG3 (ScriptExtender will load TadpoleCompanion.lua)
echo.
echo  2. Double-click "Tadpole Bridge" on your Desktop to start the
echo     bridge server, or run:
echo       cd /d "!BRIDGE_DIR!"
echo       node server.js
echo.
echo  3. On your phone, open:!CYAN!
echo     https://tadpole-omega.vercel.app!RESET!
echo.
echo  4. Enter this IP address in the app:!BOLD!
echo     !LAN_IP!:3456!RESET!
echo.
echo  !DIM!Tip: Make sure your phone and PC are on the same WiFi network.!RESET!
echo  !DIM!Tip: If the connection fails, check Windows Firewall allows port 3456.!RESET!
echo.
goto :end

:error_exit
echo.
echo  !RED!Installation failed. See errors above.!RESET!
echo  !DIM!You can re-run this installer at any time — it's safe to retry.!RESET!
echo.
goto :end

:end
cd /d "%PROJECT_ROOT%"
pause
endlocal
