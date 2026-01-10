@echo off
echo 🚀 Iniciando servidor para SkyTycoon...
echo.

REM Intentar usar PowerShell si está disponible
powershell.exe -ExecutionPolicy Bypass -File "%~dp0servidor.ps1"

if errorlevel 1 (
    echo.
    echo Intentando métodos alternativos...
    echo.
    
    REM Intentar Python
    python --version >nul 2>&1
    if %errorlevel% == 0 (
        echo ✓ Python detectado. Iniciando servidor en http://localhost:8000
        echo 🌐 Abre tu navegador en: http://localhost:8000
        echo ⏹️  Presiona Ctrl+C para detener el servidor
        echo.
        python -m http.server 8000
        goto :end
    )
    
    REM Intentar Node.js
    node --version >nul 2>&1
    if %errorlevel% == 0 (
        echo ✓ Node.js detectado. Iniciando servidor en http://localhost:8000
        echo 🌐 Abre tu navegador en: http://localhost:8000
        echo ⏹️  Presiona Ctrl+C para detener el servidor
        echo.
        npx --yes http-server -p 8000 -c-1
        goto :end
    )
    
    echo ❌ No se encontró Python ni Node.js.
    echo Por favor instala Python desde https://www.python.org/downloads/
    echo o Node.js desde https://nodejs.org/
)

:end
pause
