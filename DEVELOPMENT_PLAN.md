# SkyTycoon: Plan de Desarrollo Detallado

## Visión General

Transformar SkyTycoon de un "simulador sin meta" a un **gestor de aerolínea progresivo** donde:
- Comienzas con **capital limitado** en un **hub elegido**
- Compites contra **aerolíneas IA rivales** por reputación, ocupación y rentabilidad
- Avanzas por **10 niveles** con requisitos progresivos
- Expandir geográficamente: de 1 hub → múltiples hubs
- Reputación afecta **ocupación de vuelos** (multiplicador)
- Cada decisión (tarifas, flota, hubs) tiene consecuencias medibles

---

## Fase 1: Hub Principal y Restricción de Rutas

**Prioridad**: Alta  
**Esfuerzo**: Medio  
**Impacto**: Fundamental

### 1.1 Modelo de Hub en State

Estructura en `GameManager.state`:

```javascript
hubs: {
  MAD: {
    id: 'MAD',
    name: 'Madrid Barajas',
    slots: { used: 0, total: 4 },    // Rutas simultáneas
    dailyFee: 5000,                   // $ por día
    level: 1,
    established: timestamp,
    upgrades: {
      slots: 0,                       // Slots adicionales comprados
      runway: false                   // Runway mejorada
    }
  },
  // Otros hubs vacíos hasta fase 5
}
mainHub: 'MAD'  // Hub principal obligatorio
```

### 1.2 Pantalla de Selección de Hub (Onboarding)

**Archivo**: Nueva vista en `index.html` y render en `uiManager.js`

**Flujo**:
1. Pantalla "Bienvenido a SkyTycoon"
2. Input: nombre de aerolínea
3. Grid: mostrar 4–6 hubs con cards
   - Imagen/icono
   - Ciudad + IATA
   - Población (factor de demanda)
   - Runway (tipo de aviones permitidos)
   - Costos base: `$X/día fee`
   - Capital ajustado: "Empezarías con $8.5M"

**Lógica**:
- Usuario selecciona hub → guardarlo en `state.mainHub`
- Capital inicial: `$10M - (hub.dailyFee * 365 * 0.5)` (aprox 6 meses de fee)
  - Hub barato (MAD): ~$8.2M
  - Hub caro (JFK): ~$5.5M
- Crear entrada en `state.hubs[mainHub]` con slots=4, level=1

**Implementación**:
- Crear vista `#hub-selection-view` con grid CSS
- Método `uiManager.showHubSelection()`
- Guardar selección → `game.state.mainHub = selectedHub`
- Transicionar a dashboard tras selección

### 1.3 Validación de Rutas por Hub

**Archivo**: `routeManager.js`

**Nuevos métodos**:

```javascript
validateRouteByHub(origin, dest, currentLevel) {
  // Hasta nivel 3: ambos extremos deben tocar mainHub
  if (currentLevel < 4) {
    const mainHub = this.game.state.mainHub;
    const touchesMain = (origin === mainHub || dest === mainHub);
    if (!touchesMain) {
      return { success: false, msg: "Ruta debe tocar tu hub principal" };
    }
  }
  // Nivel 4+: solo necesitas tener hub en los extremos
  return { success: true };
}

getActiveHubs() {
  return Object.keys(this.game.state.hubs).filter(
    hubId => this.game.state.hubs[hubId].level > 0
  );
}
```

**En `createRoute()`**:
- Agregar validación: `validateRouteByHub(origin, dest, this.game.state.level)`
- Validar slots: `hubs[origin].slots.used < hubs[origin].slots.total`
- Al crear ruta exitosa: incrementar `hubs[origin].slots.used++` y `hubs[dest].slots.used++`
- Al eliminar ruta: decrementar slots

### 1.4 Fee Diario de Hub

**Archivo**: `economyManager.js`

**En `processDaily()`**:

```javascript
// Restar fee de hubs operativos
let hubFees = 0;
Object.entries(this.game.state.hubs).forEach(([hubId, hub]) => {
  if (hub.level > 0) {
    const slotsInUse = hub.slots.used;
    const fee = hub.dailyFee * slotsInUse; // Fee solo por slots ocupados
    hubFees += fee;
  }
});
this.game.state.money -= hubFees;
totalCosts += hubFees;

console.log(`🏢 Hub Fees: $${hubFees}`);
```

---

## Fase 2: Reputación y Multiplicador de Ocupación

**Prioridad**: Alta  
**Esfuerzo**: Medio  
**Impacto**: Mecánica central

### 2.1 Reputación en State

```javascript
state: {
  reputation: 50,  // 0–100 (starting mid)
  reputationHistory: [],  // [{date, delta, reason, routeId}]
  reputationRank: 1  // Tu posición en ranking
}
```

### 2.2 Factores de Reputación (Deltas Diarios)

**Lógica en `economyManager.processDaily()`**:

```javascript
// Por cada ruta activa
routes.forEach(route => {
  const plane = ...;
  let repDelta = 0;

  // 1. Puntualidad (condición)
  if (plane.condition > 80) {
    repDelta += 0.5;  // Muy confiable
  } else if (plane.condition > 60) {
    repDelta += 0.1;  // Aceptable
  } else if (plane.condition < 40) {
    repDelta -= 1.0;  // Problemas
  }

  // 2. Confort (asientos premium)
  const premiumSeats = plane.configuration.premium + plane.configuration.business;
  if (premiumSeats > 0) {
    repDelta += 0.2 * (premiumSeats / plane.baseStats.seats);
  }

  // 3. Precio justo (comparación con rivales en misma ruta)
  const myYield = calculateYield(route);
  const rivalYield = getRivalYieldOnRoute(route);  // Promedio de rivales
  if (rivalYield > 0) {
    const priceDiff = (myYield - rivalYield) / rivalYield;
    if (priceDiff > 0.15) repDelta -= 0.3;  // 15% más caro
    if (priceDiff < -0.15) repDelta += 0.1;  // Precio competitivo
  }

  // Acumular
  reputationDaily += repDelta;
  reputationHistory.push({
    date: this.game.state.date,
    delta: repDelta,
    reason: 'condition + comfort + pricing',
    routeId: route.id
  });
});

// Capped a ±5 puntos/día
reputationDaily = Math.max(-5, Math.min(5, reputationDaily));
this.game.state.reputation = Math.max(0, Math.min(100, 
  this.game.state.reputation + reputationDaily
));
```

### 2.3 Multiplicador de Load Factor

**En `routeManager.calculatePotentialRevenue()` o economyManager**:

```javascript
calculateFinalLoadFactor(baseLoadFactor = 0.85) {
  const reputation = this.game.state.reputation;
  // Mapeo: rep 0 → 60%, rep 100 → 100%
  const multiplier = 0.6 + (reputation / 100) * 0.4;
  return baseLoadFactor * multiplier;
}

// Al calcular ingresos diarios:
const baseRevenue = ...;  // Con load factor 85%
const finalLoadFactor = calculateFinalLoadFactor();
const revenue = Math.floor(baseRevenue * (finalLoadFactor / 0.85));
```

**Impacto**:
- Reputación 30 → factor 0.72 (ocupación 61%)
- Reputación 50 → factor 0.85 (ocupación 72%)
- Reputación 80 → factor 0.92 (ocupación 78%)

### 2.4 Visualización de Reputación

**En dashboard**:
```html
<div class="hero-card">
  <h3>Reputación</h3>
  <div style="display: flex; align-items: center; gap: 1rem;">
    <div style="flex: 1;">
      <div style="background: rgba(255,255,255,0.1); height: 20px; border-radius: 10px; overflow: hidden;">
        <div id="rep-bar" style="background: #f59e0b; height: 100%; width: 50%;"></div>
      </div>
    </div>
    <span id="rep-value" style="font-size: 1.5rem; font-weight: bold;">50/100</span>
  </div>
  <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.5rem;">
    <span id="rep-trend">→ Factor ocupación: 85%</span>
  </div>
</div>
```

---

## Fase 3: Aerolíneas Rival (IA Simple)

**Prioridad**: Media  
**Esfuerzo**: Medio  
**Impacto**: Competencia

### 3.1 Nuevo Manager: RivalManager

**Archivo**: `js/managers/rivalManager.js`

```javascript
export class RivalManager {
  constructor(game) {
    this.game = game;
    this.rivals = [];
  }

  initRivals() {
    // Crear 2–3 rivales con hubs distintos al del jugador
    const mainHub = this.game.state.mainHub;
    const rivals = [
      {
        id: 'rival_1',
        name: 'Iberia Plus',
        hub: 'MAD',
        profile: 'legacy',  // legacy | low-cost | premium
        reputation: 65,
        dailyIncome: 150000,
        priceMultiplier: 0.95,  // 5% más barato
        routes: ['MAD-BCN', 'MAD-AGP', 'BCN-MAD', 'AGP-MAD'],
        fleet: [
          { type: 'A320', count: 4 },
          { type: 'B787', count: 1 }
        ]
      },
      {
        id: 'rival_2',
        name: 'Ryanair Sky',
        hub: 'BCN',
        profile: 'low-cost',
        reputation: 45,
        dailyIncome: 120000,
        priceMultiplier: 0.80,  // 20% más barato
        routes: ['BCN-MAD', 'BCN-AGP', 'BCN-PMI'],
        fleet: [{ type: 'A320', count: 5 }]
      },
      // Tercero opcional en hub lejano
    ];

    this.rivals = rivals.filter(r => r.hub !== mainHub);
    return this.rivals;
  }

  getRouteCompetitors(routeId) {
    // Retorna qué rivales compiten en esta ruta
    const routes = this.game.managers.routes.getRoutes();
    const route = routes.find(r => r.id === routeId);
    if (!route) return [];

    return this.rivals.filter(rival =>
      rival.routes.some(rRoute => {
        // Mismo par de aeropuertos (ambas direcciones valen)
        return (rRoute === `${route.origin}-${route.dest}` ||
                rRoute === `${route.dest}-${route.origin}`);
      })
    );
  }

  updateRivals() {
    // Llamado monthly/weekly; ajusta ingresos/reputación ficticios
    this.rivals.forEach(rival => {
      // Varianza diaria
      rival.dailyIncome = rival.dailyIncome * (0.9 + Math.random() * 0.2);
      
      // Reputación cambia lentamente
      const trend = Math.random() > 0.5 ? 0.1 : -0.2;
      rival.reputation = Math.max(20, Math.min(95,
        rival.reputation + trend
      ));
    });
  }

  getRanking() {
    // Retorna tu posición + top 5 rivales
    const allAirlines = [
      {
        name: this.game.state.companyName,
        dailyIncome: this.game.state.lastEconomy?.gross || 0,
        reputation: this.game.state.reputation,
        isPlayer: true
      },
      ...this.rivals.map(r => ({
        name: r.name,
        dailyIncome: r.dailyIncome,
        reputation: r.reputation,
        isPlayer: false
      }))
    ];

    return allAirlines
      .sort((a, b) => b.dailyIncome - a.dailyIncome)
      .map((a, i) => ({ ...a, position: i + 1 }));
  }
}
```

### 3.2 Efecto en Ocupación

**En `economyManager.calculateFinalLoadFactor()`**:

```javascript
calculateFinalLoadFactor(route) {
  let baseLoadFactor = 0.85;

  // 1. Reputación del jugador
  const myRepMult = 0.6 + (this.game.state.reputation / 100) * 0.4;
  baseLoadFactor *= myRepMult;

  // 2. Competencia de rivales
  const rivals = this.game.managers.rivals.getRouteCompetitors(route.id);
  rivals.forEach(rival => {
    if (rival.reputation > this.game.state.reputation) {
      // Rival más reputado: tú pierdes 5% ocupación
      baseLoadFactor *= 0.95;
    } else if (rival.priceMultiplier < 0.90) {
      // Rival es low-cost y tú no: pierdes 3% ocupación
      baseLoadFactor *= 0.97;
    }
  });

  return Math.max(0.4, baseLoadFactor);  // Mínimo 40%
}
```

### 3.3 Ranking en Dashboard

**Nueva sección en dashboard**:

```html
<div class="hero-card">
  <h3>Ranking de Aerolíneas</h3>
  <div id="ranking-table" style="font-size: 0.9rem;">
    <!-- Generado por JS -->
  </div>
</div>
```

**Código en uiManager.renderDashboard()**:

```javascript
const ranking = this.game.managers.rivals.getRanking();
const rankingHtml = ranking.map((a, i) => `
  <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); ${a.isPlayer ? 'background: rgba(59,130,246,0.2);' : ''}">
    <span>#${a.position} ${a.name}</span>
    <span style="color: #4ade80;">$${formatter.format(a.dailyIncome)}</span>
    <span style="color: #f59e0b;">Rep: ${a.reputation}</span>
  </div>
`).join('');

document.getElementById('ranking-table').innerHTML = rankingHtml;
```

---

## Fase 4: Niveles y Metas de Progresión

**Prioridad**: Alta  
**Esfuerzo**: Bajo  
**Impacto**: Crea objetivo claro

### 4.1 Tabla de Requisitos

**Archivo**: `js/models/progressionModel.js` (nuevo)

```javascript
export const LEVEL_REQUIREMENTS = {
  1: {
    level: 1,
    reputation: 40,
    fleetSize: 1,
    activeRoutes: 1,
    cumulativeProfit: 0,
    unlocksAircraft: ['A320', 'A330'],
    unlocksHub: false
  },
  2: {
    level: 2,
    reputation: 50,
    fleetSize: 2,
    activeRoutes: 2,
    cumulativeProfit: 1000000,
    unlocksAircraft: ['A340', 'B777'],
    unlocksHub: false
  },
  3: {
    level: 3,
    reputation: 60,
    fleetSize: 4,
    activeRoutes: 4,
    cumulativeProfit: 10000000,
    unlocksAircraft: ['B787', 'A350'],
    unlocksHub: false
  },
  4: {
    level: 4,
    reputation: 70,
    fleetSize: 6,
    activeRoutes: 6,
    cumulativeProfit: 50000000,
    unlocksAircraft: ['B777', 'A380'],
    unlocksHub: true  // Puedes abrir segundo hub
  },
  5: {
    level: 5,
    reputation: 75,
    fleetSize: 8,
    activeRoutes: 8,
    cumulativeProfit: 100000000,
    unlocksAircraft: ['A380'],
    unlocksHub: true
  },
  10: {
    level: 10,
    reputation: 90,
    fleetSize: 15,
    activeRoutes: 12,
    cumulativeProfit: 1000000000,
    unlocksAircraft: [],
    unlocksHub: true
  }
  // Levels 6–9 interpolados
};
```

### 4.2 Tracking de Progreso

**En `GameManager.state`**:

```javascript
state: {
  level: 1,
  cumulativeProfit: 0,  // Suma de todos net diarios (nunca baja)
  levelUpNotifications: []  // Para mostrar logs de progreso
}
```

### 4.3 Verificación de Level-Up

**Método en GameManager**:

```javascript
checkLevelUp() {
  const currentLevel = this.state.level;
  const nextLevelReqs = LEVEL_REQUIREMENTS[currentLevel + 1];
  if (!nextLevelReqs) return;  // Ya max level

  const fleet = this.managers.fleet.ownedPlanes.length;
  const routes = this.managers.routes.getRoutes().length;
  const reputation = this.state.reputation;
  const profit = this.state.cumulativeProfit;

  const meetsAll = (
    reputation >= nextLevelReqs.reputation &&
    fleet >= nextLevelReqs.fleetSize &&
    routes >= nextLevelReqs.activeRoutes &&
    profit >= nextLevelReqs.cumulativeProfit
  );

  if (meetsAll) {
    this.state.level = currentLevel + 1;
    this.state.levelUpNotifications.push({
      date: this.state.date,
      level: currentLevel + 1,
      unlocks: nextLevelReqs.unlocksAircraft
    });
    console.log(`🎉 Level Up! Now Level ${currentLevel + 1}`);
    this.save();
  }
}
```

**Llamado en `economyManager.processDaily()` tras aplicar ingresos**:

```javascript
this.game.state.cumulativeProfit += Math.max(0, totalNet);
this.game.checkLevelUp();
```

### 4.4 Panel de Metas en Dashboard

```html
<div class="hero-card">
  <h3>Progreso hacia Nivel <span id="next-level">2</span></h3>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
    <div>
      <span style="color: #94a3b8;">Reputación</span>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span id="req-rep-curr">65</span> / <span id="req-rep-target">70</span>
        <span id="req-rep-check" style="color: #4ade80;">✓</span>
      </div>
    </div>
    <div>
      <span style="color: #94a3b8;">Flota</span>
      <div>
        <span id="req-fleet-curr">2</span> / <span id="req-fleet-target">4</span>
      </div>
    </div>
    <div>
      <span style="color: #94a3b8;">Rutas</span>
      <div>
        <span id="req-routes-curr">2</span> / <span id="req-routes-target">4</span>
      </div>
    </div>
    <div>
      <span style="color: #94a3b8;">Beneficio Acumulado</span>
      <div>
        <span id="req-profit-curr">$1.2M</span> / <span id="req-profit-target">$10M</span>
      </div>
    </div>
  </div>
</div>
```

---

## Fase 5: Hubs Secundarios y Expansión

**Prioridad**: Media  
**Esfuerzo**: Bajo  
**Impacto**: Late-game content

### 5.1 Apertura de Segundo Hub

**Requisitos**:
- Nivel ≥ 4
- $30M en banco
- Seleccionar hub diferente del principal

**Interfaz**: Modal similar a inicio, pero dentro del juego

**Lógica**:

```javascript
openSecondaryHub(hubId) {
  const reqs = {
    minLevel: 4,
    minCash: 30000000,
    cost: 20000000  // Inversión inicial
  };

  if (this.game.state.level < reqs.minLevel) {
    return { success: false, msg: 'Requiere Nivel 4' };
  }
  if (this.game.state.money < reqs.cost) {
    return { success: false, msg: 'Fondos insuficientes' };
  }

  // Crear entrada hub
  this.game.state.hubs[hubId] = {
    id: hubId,
    slots: { used: 0, total: 2 },
    dailyFee: 3000,
    level: 1,
    established: this.game.state.date,
    upgrades: {}
  };

  this.game.state.money -= reqs.cost;
  this.game.save();

  return { success: true };
}
```

### 5.2 Mejoras de Hub

**Comprar slots**:
- Costo: $2M por slot
- Máximo: 10 slots total
- Impacto: permite más rutas simultáneas

**Mejorar runway**:
- Costo: $1M
- Impacto: reduce tasas aeroportuarias en 10%

---

## Fase 6: UI y Onboarding Mejorado

**Prioridad**: Alta  
**Esfuerzo**: Medio  
**Impacto**: Claridad y experiencia

### 6.1 Flujo de Bienvenida

**Pantalla 1**: Logo + "Bienvenido a SkyTycoon"
**Pantalla 2**: Selección de Hub (grid con 4–6 opciones)
**Pantalla 3**: Nombre de Aerolínea (input)
**Pantalla 4**: Resumen (capital, hub, inicio partida)

### 6.2 Tutorial Interactivo (Opcional)

- Pop-ups guiando primeros pasos
- "Crea tu primera ruta"
- "Compra tu primer avión"
- Pausable

### 6.3 Dashboard Completo

Mostrar en orden:
1. **Reputación** (barra + trend)
2. **Nivel** (progreso con checklist)
3. **Ranking** (tu posición + top 3)
4. **KPIs**: Balance, Rutas, Flota, Ingresos/Gastos/Neto
5. **Acceso Rápido** (botones a compra, rutas, flota)

---

## Integración de Datos

### GameManager Changes

```javascript
constructor() {
  this.state = {
    companyName: "SkyStart Airlines",
    mainHub: null,  // Seleccionado en onboarding
    hubs: {},  // Inicializado post-selección
    money: 10000000,  // Ajustado por hub
    reputation: 50,
    level: 1,
    cumulativeProfit: 0,
    lastEconomy: { gross: 0, costs: 0, net: 0 },
    isPaused: false
  };

  this.managers = {
    time: new TimeManager(this),
    economy: new EconomyManager(this),
    story: new StoryManager(this),
    fleet: new FleetManager(this),
    routes: new RouteManager(this),
    rivals: new RivalManager(this)  // Nuevo
  };
}

async newGame(selectedHub) {
  this.state.mainHub = selectedHub;
  this.state.hubs[selectedHub] = {
    id: selectedHub,
    slots: { used: 0, total: 4 },
    dailyFee: this.getHubBaseFee(selectedHub),
    level: 1,
    established: this.state.date,
    upgrades: {}
  };

  const baseCash = 10000000;
  const hubCostFactor = this.getHubCostFactor(selectedHub);
  this.state.money = baseCash - (baseCash * hubCostFactor * 0.5);

  this.managers.rivals.initRivals();
  this.managers.story.startIntro();
  
  await this.save();
}
```

### Persistencia

En `DB.saveState()`, asegurar que se guardan:
- `state.mainHub`
- `state.hubs`
- `state.reputation`
- `state.level`
- `state.cumulativeProfit`
- `rivals` (estado de IA)

---

## Testing Manual por Fase

### Fase 1: Hub Base
- [ ] Seleccionar hub → se guarda en `state.mainHub`
- [ ] Capital varía según hub seleccionado
- [ ] Crear ruta MAD–BCN → éxito
- [ ] Crear ruta JFK–LAX (sin main hub) → fracaso
- [ ] Slots incrementan correctamente al crear ruta
- [ ] Fee diario se resta en economía

### Fase 2: Reputación
- [ ] Reputación sube/baja en consola tras `processDaily()`
- [ ] Load factor varía con reputación: rep 30 → 60%, rep 80 → 90%
- [ ] Ingresos cambian según reputación
- [ ] Dashboard muestra barra de reputación

### Fase 3: Rivales
- [ ] 2–3 rivales inicializados en hubs diferentes
- [ ] Ranking muestra rival + ti + ingresos
- [ ] Si rival en ruta coincidente con reputación > tuya → tu ocupación baja 5%
- [ ] Rivals.getRanking() funciona

### Fase 4: Niveles
- [ ] Cumplir requisitos de nivel 2 → level-up notificación
- [ ] Dashboard muestra checklist de requisitos
- [ ] Desbloquea aircraft nuevo al subir nivel

### Fase 5: Hub Secundario
- [ ] Nivel < 4 → no se puede abrir
- [ ] Cash < $30M → no se puede abrir
- [ ] Abrir segundo hub → se resta $20M y se crea entrada
- [ ] Crear rutas desde hub secundario

### Fase 6: UI
- [ ] Onboarding completo: hub → nombre → start
- [ ] Dashboard muestra todas las secciones
- [ ] Ranking visible y actualiza
- [ ] Metas del siguiente nivel claras

---

## Balance y Ajustes

### Capital Inicial
- **Hub barato** (MAD, BCN): $8–9M
- **Hub medio** (LHR, CDG): $7–8M
- **Hub caro** (JFK, SFO): $5–6M

### Márgenes de Rentabilidad
Esperado: 30–40% net margin en rutas optimales
- Rutas cortas (300km): margen 35%
- Rutas medias (900km): margen 38%
- Rutas largas (5000km): margen 32% (más costos)

### Curva de Progresión
- **Nivel 1–2**: 1–2 semanas de juego
- **Nivel 2–4**: 2–4 semanas
- **Nivel 4–7**: 4–8 semanas
- **Nivel 7–10**: 8–16 semanas (late game largo)

### Penalizaciones
Si flota degrada (condition < 40%):
- Reputación: –1/día
- Load factor: –10%
- Recovery lento: solo mejora con mantenimiento ($)

---

## Roadmap de Desarrollo

| # | Fase | Archivos Nuevos/Modif | Estimado |
|---|------|----------------------|----------|
| 1 | Hub Base | routeManager, economyManager, state | 3–4h |
| 2 | Reputación | economyManager, uiManager | 3–4h |
| 3 | Rivales | rivalManager (nuevo) | 2–3h |
| 4 | Niveles | progressionModel, gameManager | 1–2h |
| 5 | Hub Sec. | routeManager, gameManager | 1h |
| 6 | UI | index.html, uiManager, css | 3–4h |
| **Total** | | | **13–18h** |

---

## Notas Adicionales

### Escalabilidad Futura
- Eventos aleatorios: huelga, clima, combustible sube
- Sistema de alianzas: compartir slots con otra IA
- Campañas bonificadas: "Semana low-cost"
- Cosmética: livery de avión, nombre custom
- Modo multijugador asincrónico (guardar/compartir archivo)

### Assets Visuales Necesarios
- Logos simples de rivales
- Icono/color por perfil de aerolínea
- Gradientes de barra de reputación

### Documentación para Jugador
- Tutorial integrado (pop-ups)
- Ayuda contextual: "¿Qué es reputación?"
- Wiki en juego: costos, fórmulas, estrategia

---

## Conclusión

Este plan transforma SkyTycoon de un simulador libre a un **juego de estrategia con metas claras, restricciones significativas y competencia real**.

Comienza por **Fase 1** (Hub Base) para establecer la mecánica fundamental. El resto de fases construyen sobre ese cimiento.

**Secuencia recomendada**: 1 → 4 (niveles simples) → 2 (reputación) → 3 (rivales) → 6 (UI pulida) → 5 (expansión).
