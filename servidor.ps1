# Script para lanzar el servidor del juego SkyTycoon
# Intenta usar diferentes métodos según lo que esté disponible

Write-Host "🚀 Iniciando servidor para SkyTycoon..." -ForegroundColor Green
Write-Host ""

$port = 8000
$url = "http://localhost:$port"

# Función para verificar si un comando existe
function Test-Command {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Método 1: Python http.server
if (Test-Command "python") {
    Write-Host "✓ Python detectado. Usando Python http.server..." -ForegroundColor Yellow
    Write-Host "📡 Servidor iniciado en: $url" -ForegroundColor Cyan
    Write-Host "🌐 Abre tu navegador en: $url" -ForegroundColor Cyan
    Write-Host "⏹️  Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
    Write-Host ""
    python -m http.server $port
    exit
}

# Método 2: Python3 (en algunos sistemas)
if (Test-Command "python3") {
    Write-Host "✓ Python3 detectado. Usando Python3 http.server..." -ForegroundColor Yellow
    Write-Host "📡 Servidor iniciado en: $url" -ForegroundColor Cyan
    Write-Host "🌐 Abre tu navegador en: $url" -ForegroundColor Cyan
    Write-Host "⏹️  Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
    Write-Host ""
    python3 -m http.server $port
    exit
}

# Método 3: Node.js http-server (npx)
if (Test-Command "node") {
    Write-Host "✓ Node.js detectado. Usando http-server..." -ForegroundColor Yellow
    Write-Host "📡 Servidor iniciado en: $url" -ForegroundColor Cyan
    Write-Host "🌐 Abre tu navegador en: $url" -ForegroundColor Cyan
    Write-Host "⏹️  Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
    Write-Host ""
    npx --yes http-server -p $port -c-1
    exit
}

# Método 4: PHP built-in server
if (Test-Command "php") {
    Write-Host "✓ PHP detectado. Usando PHP built-in server..." -ForegroundColor Yellow
    Write-Host "📡 Servidor iniciado en: $url" -ForegroundColor Cyan
    Write-Host "🌐 Abre tu navegador en: $url" -ForegroundColor Cyan
    Write-Host "⏹️  Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
    Write-Host ""
    php -S localhost:$port
    exit
}

# Si no se encuentra ninguna herramienta
Write-Host "❌ No se encontró ninguna herramienta para lanzar el servidor." -ForegroundColor Red
Write-Host ""
Write-Host "Por favor, instala una de las siguientes opciones:" -ForegroundColor Yellow
Write-Host "  1. Python: https://www.python.org/downloads/" -ForegroundColor White
Write-Host "  2. Node.js: https://nodejs.org/" -ForegroundColor White
Write-Host "  3. PHP: https://www.php.net/downloads.php" -ForegroundColor White
Write-Host ""
Write-Host "O usa una extensión de VS Code como 'Live Server'" -ForegroundColor Yellow
