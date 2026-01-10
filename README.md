# 🎮 SkyTycoon - Simulador de Aerolínea

Juego de simulación de gestión de aerolínea desarrollado como PWA (Progressive Web App).

## 🚀 Inicio Rápido

### Opción 1: Usando el script incluido
```bash
# Windows
servidor.bat
# o
servidor.ps1
```

### Opción 2: Manual
```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx http-server -p 8000 -c-1

# Con PHP
php -S localhost:8000
```

Luego abre: `http://localhost:8000`

## 📁 Estructura del Proyecto

```
Game/
├── index.html          # Página principal
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── assets/            # Imágenes y recursos
├── css/               # Estilos
│   ├── style.css
│   ├── ui.css
│   ├── components.css
│   ├── animations.css
│   ├── visuals.css
│   └── aircraft-details.css
└── js/                # Código JavaScript
    ├── app.js         # Punto de entrada
    ├── core/          # Núcleo del juego
    │   ├── game.js    # GameManager
    │   └── db.js      # IndexedDB
    ├── managers/      # Gestores de sistemas
    │   ├── timeManager.js
    │   ├── economyManager.js
    │   ├── fleetManager.js
    │   ├── routeManager.js
    │   ├── competitorManager.js
    │   └── uiManager.js
    ├── models/        # Modelos de datos
    │   ├── aircraft.js
    │   ├── airport.js
    │   ├── levelSystem.js
    │   ├── regionsData.js
    │   ├── fuelSystem.js
    │   ├── fuelProviders.js
    │   └── ...
    └── story/         # Sistema de historias
        └── storyManager.js
```

## 🎯 Características Principales

### Sistema de Niveles (1-10)
- Progresión basada en reputación, flota, rutas y beneficios
- Desbloqueo progresivo de aviones y aeropuertos
- Expansión regional basada en hub inicial
- Límites y bonificaciones por nivel

### Gestión de Flota
- 50 tipos de aviones reales
- Sistema de compra, mantenimiento y configuración
- Desbloqueo progresivo según nivel

### Gestión de Rutas
- 143 aeropuertos del mundo
- Sistema de distancias y autonomía
- Competencia dinámica
- Precios y demanda realistas

### Sistema Económico
- Contratos de combustible (Shell, BP, TotalEnergies)
- Contratos corporativos
- Sistema de préstamos
- Eventos y crisis económicas

### Hubs
- Selección de hub inicial al comenzar
- Apertura de hubs secundarios
- Sistema de slots y tarifas diarias

## 📚 Documentación Técnica

Los siguientes documentos contienen especificaciones técnicas:

- `GDD_VISION_CORE.md` - Visión general y diseño del juego
- `fuel_system.md` - Sistema de combustible
- `fuel_providers_system.md` - Proveedores de combustible
- `corporate_contracts.md` - Sistema de contratos corporativos

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Almacenamiento**: IndexedDB
- **PWA**: Service Worker, Web App Manifest
- **Mapas**: Leaflet.js
- **Icons**: Font Awesome

## 📝 Notas de Desarrollo

- El juego se ejecuta completamente en el cliente (sin backend)
- Los datos se guardan localmente usando IndexedDB
- Compatible con navegadores modernos (Chrome, Firefox, Edge, Safari)

## 🐛 Debug

En la consola del navegador (F12) puedes acceder a:

```javascript
// Instancia del juego
window.app.game

// Estado del juego
game.state

// Sistema de niveles
game.levelSystem

// Managers
game.managers
```

## 📄 Licencia

Proyecto privado - Todos los derechos reservados
