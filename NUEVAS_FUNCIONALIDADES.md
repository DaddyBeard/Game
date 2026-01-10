# Nuevas Funcionalidades Implementadas

## 🎯 Sistema de Frecuencias de Vuelos

### ¿Qué es?
Ahora puedes configurar cuántos vuelos por semana opera cada ruta. Antes todas las rutas eran diarias, ahora tienes 5 opciones:

- **1 vuelo/semana** - Rutas de baja demanda
- **2 vuelos/semana** - Rutas ocasionales
- **3 vuelos/semana** - Rutas regulares
- **Diario (7 vuelos/semana)** - Rutas estándar (default)
- **2 vuelos/día (14/semana)** - Rutas de alta demanda

### Cómo usar:
1. Ve a la vista de **Rutas**
2. Haz clic en cualquier tarjeta de ruta
3. En el modal que aparece, usa el selector "✈️ Frecuencia de Vuelos"
4. Selecciona la frecuencia deseada
5. Haz clic en "Aplicar Cambios"

### Impacto:
- Los **ingresos diarios** se calculan automáticamente según la frecuencia
- Mayor frecuencia = más ingresos (pero también más costos operativos en el futuro)
- La frecuencia se muestra en cada tarjeta de ruta:
  - `1x/sem`, `2x/sem`, `3x/sem`, `Diario`, `2x/día`

### Ejemplo:
```
Ruta: MAD ➔ BCN
Frecuencia Diaria: $10,000/día
Frecuencia 3x/semana: $4,286/día (10k * 3/7)
Frecuencia 14x/semana: $20,000/día (10k * 14/7)
```

---

## 🎲 Sistema de Eventos Aleatorios en Rutas

### Tipos de Eventos:

#### 1. ❌ Cancelación por Clima
- **Probabilidad**: 2% base + bonus por condición del avión
  - Si el avión tiene baja condición (<60%), hay más riesgo
  - Fórmula: `2% + ((100 - condición) / 100 * 3%)`
- **Impacto**:
  - Pierdes los ingresos de ese vuelo
  - Pagas compensación del 30% a los pasajeros
  - -1 punto de reputación
- **Ejemplo**: 
  ```
  Avión con 40% condición: ~4% probabilidad diaria
  Avión con 90% condición: ~2.3% probabilidad diaria
  ```

#### 2. ⏰ Retraso
- **Probabilidad**: 5% diario
- **Duración**: 1-4 horas aleatorio
- **Impacto**:
  - No pierdes ingresos
  - Pierdes reputación: -0.5 puntos por cada hora de retraso
- **Ejemplo**: 
  ```
  Retraso de 3 horas = -1.5 reputación
  ```

#### 3. 📈 Overbooking (Sobreventa)
- **Probabilidad**: 3% diario
- **Impacto Positivo**:
  - 10% más pasajeros que capacidad normal
  - ~$150 extra por pasajero adicional
- **Riesgo**:
  - 30% de probabilidad de que haya compensación
  - Si hay compensación: pagas 50% de los ingresos extra
  - -0.5 reputación si hay compensación
- **Ejemplo**:
  ```
  Ruta con 150 asientos: 15 pasajeros extra
  Ingreso extra: 15 * $150 = $2,250
  Si hay compensación: pagas $1,125 y pierdes 0.5 reputación
  ```

### ¿Dónde se ven los eventos?

#### En la vista de Rutas:
Las tarjetas de ruta ahora muestran **badges** de eventos de las últimas 24 horas:
- ❌ **Cancelado** (rojo)
- ⏰ **Retraso** (naranja)
- 📈 **Overbooking** (morado)

#### En el modal de ruta:
Al hacer clic en una ruta, verás una sección "📋 Eventos Recientes (7 días)" con:
- Fecha del evento
- Tipo de evento
- Mensaje descriptivo
- Color según severidad

### Procesamiento:
- Los eventos se procesan **automáticamente cada día del juego**
- Se guardan en el historial por 3 días
- Afectan tu dinero y reputación en tiempo real
- Aparecen en el log de eventos

---

## 🎨 Mejoras Visuales

### Tarjetas de Ruta Actualizadas:
Cada ruta ahora muestra:
1. **Origen ➔ Destino**
2. **Modelo de avión**
3. **Distancia • Hub Base • Frecuencia**
4. **Badges de eventos activos** (si los hay)
5. **Competencia** (Baja/Media/Alta)
6. **Estrategia de precios** (Low-Cost/Normal/Premium)
7. **Yield** (ingreso por pasajero/km)
8. **Ingreso diario**

### Modal de Ruta Mejorado:
Ahora incluye:
- Control de precio (slider 70%-150%)
- **Selector de frecuencia** (nuevo)
- Vista previa en tiempo real de ingresos
- **Historial de eventos** de últimos 7 días (nuevo)
- Tips sobre precios y frecuencias

---

## 📊 Datos Técnicos

### Estructura de Ruta (actualizada):
```javascript
{
  id: "...",
  origin: "MAD",
  dest: "BCN",
  distance: 500,
  assignedPlane: "...",
  seats: { economy: 140, premium: 30, business: 10 },
  priceMultiplier: 1.0,
  frequency: 7,              // NUEVO
  dailyRevenue: 10000,       // Calculado con frecuencia
  hubBase: "MAD",
  events: [],                // NUEVO - Array de eventos
  lastEventCheck: timestamp  // NUEVO - Control diario
}
```

### Evento:
```javascript
{
  type: "cancellation" | "delay" | "overbooking",
  timestamp: Date,
  message: "Descripción del evento",
  impact: { money: -5000, reputation: -1 }
}
```

---

## 🎮 Estrategias Recomendadas

### Optimización de Frecuencias:
1. **Rutas cortas/regionales**: 3-7 vuelos/semana
2. **Rutas largas premium**: 1-3 vuelos/semana
3. **Rutas hub-to-hub**: Diario o 2x/día
4. **Rutas experimentales**: 1-2 vuelos/semana para probar demanda

### Gestión de Eventos:
1. **Mantén aviones en buena condición** (>70%) para reducir cancelaciones
2. **No dependas de 1 sola ruta** - diversifica para minimizar impacto
3. **Monitorea reputación** - eventos frecuentes afectan tu marca
4. **Overbooking es arriesgado pero rentable** - úsalo estratégicamente

### Combinación Precio + Frecuencia:
- **Low-cost + Alta frecuencia**: Maximiza volumen
- **Premium + Baja frecuencia**: Maximiza yield
- **Normal + Diario**: Balance estándar

---

## 🔄 Migración de Partidas Antiguas

Si ya tenías rutas antes de esta actualización:
- ✅ Todas tus rutas ahora tienen `frequency: 7` (diario)
- ✅ El array `events` está vacío
- ✅ Los ingresos se recalcularon automáticamente
- ✅ No necesitas hacer nada, todo es compatible

---

## 🐛 Notas de Desarrollo

- Versión del Service Worker: **v94**
- Archivos modificados:
  - `js/managers/routeManager.js` (métodos nuevos: `updateRouteFrequency`, `processRouteEvents`, `getRouteEvents`)
  - `js/managers/economyManager.js` (integración de eventos en `processDaily`)
  - `js/managers/uiManager.js` (UI mejorada con frecuencias y eventos)
  - `sw.js` (actualización de caché)

---

**¡Disfruta las nuevas funcionalidades!** 🎉
