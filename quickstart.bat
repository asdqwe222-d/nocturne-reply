@echo off
chcp 65001 >nul
title Nocturne Quick Start
color 0A

echo ========================================
echo   🌙 Nocturne Reply Forge - Quick Start
echo ========================================
echo   Starting ALL required services...
echo ========================================
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Check if Ollama is installed
echo [1/6] Checking Ollama installation...
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Ollama is not installed or not in PATH
    echo Please install Ollama from https://ollama.ai
    pause
    exit /b 1
)
echo [OK] Ollama found

REM Check if Node.js is installed
echo [2/6] Checking Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Check if Python is installed (for test server)
echo [3/6] Checking Python installation (for test server)...
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Python not found - test server may not work
    echo You can still use chathomebase.com instead
    set PYTHON_AVAILABLE=0
) else (
    echo [OK] Python found
    set PYTHON_AVAILABLE=1
)

echo.
echo [4/6] Checking/creating Ollama model...
echo [INFO] Checking if Ollama is responding...
timeout /t 1 /nobreak >nul
ollama list >"%TEMP%\ollama_check.txt" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Ollama may not be responding yet
    echo [INFO] Waiting a bit longer for Ollama to start...
    timeout /t 3 /nobreak >nul
    ollama list >"%TEMP%\ollama_check2.txt" 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Ollama is not responding!
        echo [INFO] Please start Ollama manually: ollama serve
        echo [INFO] Or check if Ollama service is running
        pause
        exit /b 1
    )
)
echo [OK] Ollama is responding

echo [INFO] Checking for model 'nocturne-swe'...
REM Use a timeout approach - write to temp file and check
ollama list >"%TEMP%\ollama_models.txt" 2>&1
findstr /C:"nocturne-swe" "%TEMP%\ollama_models.txt" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Model 'nocturne-swe' not found!
    echo [INFO] Creating model from Modelfile...
    if not exist "Modelfile" (
        echo [ERROR] Modelfile not found in current directory!
        echo [INFO] Current directory: %CD%
        pause
        exit /b 1
    )
    echo [INFO] This may take a minute...
    ollama create nocturne-swe -f Modelfile
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create model
        echo [INFO] Check the error above for details
        pause
        exit /b 1
    )
    echo [OK] Model created successfully
) else (
    echo [OK] Model 'nocturne-swe' found
)

echo.
echo [5/6] Checking Ollama server...
REM Check if Ollama is already running
ollama list >"%TEMP%\ollama_status.txt" 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Ollama server is already running (Windows service or background)
    echo [INFO] No need to start Ollama manually - it's already active
    set OLLAMA_RUNNING=1
    set OLLAMA_STARTED=0
    goto :skip_ollama_start
)

REM Only start Ollama if it's NOT running
echo [INFO] Ollama server not detected, starting it...
REM Start Ollama in a new window that stays open
set "OLLAMA_BATCH=%TEMP%\start_ollama.bat"
echo @echo off > "%OLLAMA_BATCH%"
echo title Ollama Server >> "%OLLAMA_BATCH%"
echo color 0B >> "%OLLAMA_BATCH%"
echo echo ======================================== >> "%OLLAMA_BATCH%"
echo echo   Ollama Server >> "%OLLAMA_BATCH%"
echo echo ======================================== >> "%OLLAMA_BATCH%"
echo echo. >> "%OLLAMA_BATCH%"
echo echo Starting Ollama server... >> "%OLLAMA_BATCH%"
echo echo Keep this window open! >> "%OLLAMA_BATCH%"
echo echo. >> "%OLLAMA_BATCH%"
echo echo If you see 'port already in use' error: >> "%OLLAMA_BATCH%"
echo echo   - Ollama is already running as Windows service >> "%OLLAMA_BATCH%"
echo echo   - This is NORMAL - you can close this window >> "%OLLAMA_BATCH%"
echo echo. >> "%OLLAMA_BATCH%"
echo ollama serve >> "%OLLAMA_BATCH%"
echo echo. >> "%OLLAMA_BATCH%"
echo echo [INFO] Ollama process ended. >> "%OLLAMA_BATCH%"
echo echo [INFO] If you saw 'port already in use', Ollama is running as a service. >> "%OLLAMA_BATCH%"
echo echo [INFO] This is normal - you can close this window. >> "%OLLAMA_BATCH%"
echo echo. >> "%OLLAMA_BATCH%"
echo echo Press any key to close this window... >> "%OLLAMA_BATCH%"
echo pause ^>nul >> "%OLLAMA_BATCH%"
start "Ollama Server" cmd /k "%TEMP%\start_ollama.bat"
set OLLAMA_STARTED=1
timeout /t 3 /nobreak >nul
REM Verify it's accessible
ollama list >"%TEMP%\ollama_verify.txt" 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Ollama server is accessible
    set OLLAMA_RUNNING=1
) else (
    echo [WARNING] Ollama may not be responding yet
    echo [INFO] Waiting a bit longer...
    timeout /t 5 /nobreak >nul
    ollama list >"%TEMP%\ollama_verify2.txt" 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Ollama server is now accessible
        set OLLAMA_RUNNING=1
    ) else (
        echo [WARNING] Ollama server may need manual start
        echo [INFO] Check the Ollama Server window for details
        set OLLAMA_RUNNING=0
    )
)

:skip_ollama_start

echo.
echo [6/6] Starting Node.js server...
set "NODE_DIR=%SCRIPT_DIR%..\gpt-relay-server"
REM Convert to absolute path
for %%I in ("%NODE_DIR%") do set "NODE_DIR=%%~fI"

echo [DEBUG] Script directory: %SCRIPT_DIR%
echo [DEBUG] Node directory (relative): %SCRIPT_DIR%..\gpt-relay-server
echo [DEBUG] Node directory (absolute): %NODE_DIR%

if not exist "%NODE_DIR%" (
    echo [ERROR] Node.js server directory not found!
    echo [ERROR] Expected: %NODE_DIR%
    echo [INFO] Current directory: %CD%
    echo [INFO] Please ensure gpt-relay-server exists as a sibling to nocturne-reply-forge
    pause
    exit /b 1
)
echo [OK] Node.js server directory found

cd /d "%NODE_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to change to Node.js directory
    pause
    exit /b 1
)
echo [INFO] Changed to Node.js directory

REM Check if node_modules exists
dir node_modules >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Installing dependencies (first time only)...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo [OK] node_modules found
)

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo Creating .env template...
    echo OPENAI_API_KEY=sk-proj-your-key-here > .env
    echo PORT=3000 >> .env
    echo ALLOWED_ORIGINS=* >> .env
    echo [INFO] Created .env template - please edit it and add your OpenAI API key
    echo [INFO] Continuing with default settings...
    timeout /t 1 /nobreak >nul
)

REM Check if port 3000 is already in use
netstat -an | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Port 3000 is already in use!
    echo [INFO] Node.js server may already be running
    echo [INFO] Will attempt to start anyway...
    timeout /t 2 /nobreak >nul
)

REM Create batch file to start Node.js server
set "BATCH_FILE=%TEMP%\start_nodejs.bat"
(
    echo @echo off
    echo title Nocturne Server
    echo color 0E
    echo cd /d "%%NODE_DIR%%"
) > "%BATCH_FILE%"
set "NODE_DIR_VAR=%NODE_DIR%"
setlocal enabledelayedexpansion
(
    echo @echo off
    echo title Nocturne Server
    echo color 0E
    echo cd /d "!NODE_DIR_VAR!"
) > "%BATCH_FILE%"
endlocal
echo echo ======================================== >> "%BATCH_FILE%"
echo echo   Nocturne Node.js Server >> "%BATCH_FILE%"
echo echo ======================================== >> "%BATCH_FILE%"
echo echo Keep this window open! >> "%BATCH_FILE%"
echo echo. >> "%BATCH_FILE%"
echo echo Starting server on http://localhost:3000 >> "%BATCH_FILE%"
echo echo Directory: %NODE_DIR% >> "%BATCH_FILE%"
echo echo. >> "%BATCH_FILE%"
echo node server.js >> "%BATCH_FILE%"
echo echo. >> "%BATCH_FILE%"
echo echo [INFO] Server stopped. >> "%BATCH_FILE%"
echo echo Press any key to close... >> "%BATCH_FILE%"
echo pause >> "%BATCH_FILE%"

start "Nocturne Server" cmd /k "%TEMP%\start_nodejs.bat"
timeout /t 3 /nobreak >nul
echo [OK] Node.js server started (check window for status)

REM Start test web server if Python is available
if "%PYTHON_AVAILABLE%"=="1" (
    echo.
    echo [BONUS] Starting test web server...
    cd /d "%SCRIPT_DIR%"
    netstat -an | findstr ":8000" | findstr "LISTENING" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [INFO] Port 8000 already in use - test server may already be running
    ) else (
        REM Create batch file to start web server
        set "WEB_BATCH=%TEMP%\start_webserver.bat"
        echo @echo off > "%WEB_BATCH%"
        echo title Test Web Server >> "%WEB_BATCH%"
        echo color 0D >> "%WEB_BATCH%"
        echo cd /d "%SCRIPT_DIR%" >> "%WEB_BATCH%"
        echo echo ======================================== >> "%WEB_BATCH%"
        echo echo   Test Web Server >> "%WEB_BATCH%"
        echo echo ======================================== >> "%WEB_BATCH%"
        echo echo Keep this window open! >> "%WEB_BATCH%"
        echo echo. >> "%WEB_BATCH%"
        echo echo Serving test-chat.html on http://localhost:8000 >> "%WEB_BATCH%"
        echo echo Directory: %SCRIPT_DIR% >> "%WEB_BATCH%"
        echo echo Press Ctrl+C to stop >> "%WEB_BATCH%"
        echo echo. >> "%WEB_BATCH%"
        echo python -m http.server 8000 >> "%WEB_BATCH%"
        echo echo. >> "%WEB_BATCH%"
        echo echo [INFO] Server stopped. >> "%WEB_BATCH%"
        echo echo Press any key to close... >> "%WEB_BATCH%"
        echo pause >> "%WEB_BATCH%"
        start "Test Web Server" cmd /k "%TEMP%\start_webserver.bat"
        timeout /t 2 /nobreak >nul
        echo [OK] Test web server started on http://localhost:8000 (check window for status)
    )
)

echo.
echo ========================================
echo   ✅ ALL SERVICES STARTED!
echo ========================================
echo.
echo 📋 Running Services:
if "%OLLAMA_RUNNING%"=="1" (
    echo   ✅ Ollama Server: Running (port 11434)
) else (
    echo   ⚠️  Ollama Server: Check manually
)
echo   ✅ Node.js Server: http://localhost:3000
if "%PYTHON_AVAILABLE%"=="1" (
    echo   ✅ Test Web Server: http://localhost:8000/test-chat.html
) else (
    echo   ⚠️  Test Web Server: Not started (Python not found)
)
echo.
echo 🚀 Next Steps:
echo   1. Open http://localhost:8000/test-chat.html (or chathomebase.com)
echo   2. Tampermonkey script should load automatically
echo   3. Click "⚡ Generate Reply" to test
echo.
echo 💡 Tip: Keep all CMD windows open while using Nocturne
echo.
echo Press any key to open test page...
pause >nul

REM Try to open test page
if "%PYTHON_AVAILABLE%"=="1" (
    start http://localhost:8000/test-chat.html 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [INFO] Could not open test page automatically
        echo Please navigate to: http://localhost:8000/test-chat.html
    )
) else (
    echo [INFO] Test server not available
    echo Please navigate to: chathomebase.com
)

echo.
echo ========================================
echo   All services are running!
echo ========================================
echo.
echo To stop services:
echo   • Close the CMD windows
echo   • Or press Ctrl+C in each window
echo.
echo Press any key to exit this window...
echo (Services will keep running in their own windows)
pause >nul

REM Cleanup temp files
if exist "%TEMP%\start_ollama.bat" del "%TEMP%\start_ollama.bat" >nul 2>&1
if exist "%TEMP%\start_nodejs.bat" del "%TEMP%\start_nodejs.bat" >nul 2>&1
if exist "%TEMP%\start_webserver.bat" del "%TEMP%\start_webserver.bat" >nul 2>&1
if exist "%TEMP%\ollama_models.txt" del "%TEMP%\ollama_models.txt" >nul 2>&1
