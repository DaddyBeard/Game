# 🎮 SkyTycoon: Airline Manager - VISIÓN CORE

**Última actualización:** Enero 2025 | **Fase:** Semana 2 completa

---

## 🧠 A. VISIÓN DEL JUEGO

### La Fantasía del Jugador
> **"Quiero construir mi propia aerolínea global desde cero, tomando decisiones estratégicas reales que importen."**

### El Problema que Resuelve
- **Airline Manager** (Tycoon clásico): Simulación pura, curva de aprendizaje empinada, requiere matemática
- **Tycoon casual**: Muchos clics, poco estratégico, todo es automático
- **SkyTycoon**: Decisiones estratégicas claras + feedback inmediato + progresión visible

### Diferenciador Clave
1. **Elasticidad de precios**: No "subes precio = más dinero". Hay trade-offs reales.
2. **Observabilidad**: Ves demanda, competencia, márgenes. No es "caja negra".
3. **Volatilidad**: Combustible, eventos, competencia = el mercado cambia.
4. **Decisiones, no clics**: Cada acción tiene implicación (no gatear slots de hub = "wasted").
5. **Offline-first PWA**: Juega en el metro, sincroniza en casa.

---

## 🎯 B. LOOP PRINCIPAL DE JUEGO

### Cada 5 minutos (Sesión corta)
```
Revisar Panel de Economía (ingresos/gastos del día)
  ↓
Revisar Panel de Rutas (demanda actual vs capacidad)
  ↓
Ajustar 1-2 precios si hay oportunidad
  ↓
O comprar combustible si está barato
  ↓
Ver cambios en ocupación/ingresos
  ↓
→ Cerrar y volver al trabajo
```

### Cada sesión (15-30 minutos)
```
Chequear salud general (reputación, dinero, flota)
  ↓
Ver si hay rutas nuevas rentables
  ↓
Crear/eliminar rutas
  ↓
Optimizar configuración de asientos en 2-3 rutas problemáticas
  ↓
Comprar contrato de combustible si hay volatilidad
  ↓
Notar que competencia bajó precios
  ↓
Reaccionar ajustando 1-2 rutas
  ↓
Volver mañana
```

### Lo que lo hace volver (Hooks de Retención)
1. **Economía viva**: Cada día hay cambios (eventos, combustible, competencia)
2. **Decisions matter**: Sus acciones afectan números visibles
3. **FOMO controlado**: "Ese evento sube demanda 25% por 7 días" → urgencia sin toxicidad
4. **Sensación de control**: No es "suerte". Las acciones correlacionan con resultados.
5. **Progresión visible**: Hub level ↑, flota ↑, rutas ↑ = narrativa clara

---

## ⚙️ C. MECÁNICAS CORE

### 1. **Flota (Aviones)**
- **Comprar/vender**: Inversión inicial, puede financiarse
- **Leasing**: NO implementado aún (Semana 4+)
- **Mantenimiento**: A-Check (1 día, +20% condition), B-Check (3 días, 100%)
- **Envejecimiento**: Costos +1% cada 1500 días de operación
- **Degradación**: 0.5-1.5% condition/día volando
- **Estado**: IDLE, FLIGHT, MAINT
- **Configuración**: Economy/Premium/Business (usuario decide split)

### 2. **Rutas**
- **Creación**: Selecciona origen + destino + avión, paga $5k + $2/km
- **Distancia**: Haversine (lat/lon real)
- **Validaciones**: Rango, pista, condición avión
- **Precio**: Multiplicador 0.7x (low-cost) a 1.5x (premium)
- **Frecuencia**: 1, 2, 3, 7, o 14 vuelos/semana
- **Demanda**: Función de población, distancia, clase, precio
- **Competencia**: 2-4 rivales pueden volar la misma ruta

### 3. **Economía**
**Ingresos:**
- Precio base = 50 + (distancia × 0.12)
- Multiplicador por clase: Economy 1x, Premium 2.2x, Business 4x
- Load factor: 50-95% según reputación + precio vs rivales
- Eventos: ±25% demanda según tipo

**Gastos:**
- **Combustible**: fuelBurn × distancia × precio (MAYOR costo ~40%)
- **Crew**: $1200 base + $0.2/km (CRÍTICO)
- **Limpieza**: $500 por turno
- **Mantenimiento reserva**: $5/km × envejecimiento
- **Airport fees**: Depende población (~$100-$500)
- **Hub fee**: Diario, por slots usados

**Márgenes típicos:** 40% (sin hedging) → 45-50% (con hedging)

### 4. **Reputación** (-100 a +100)
**Sube por:**
- Rutas en alto demand (hasta +3/día)
- Crecimiento estratégico (+2/día)
- Alta frecuencia (+0.3/día)

**Baja por:**
- Cancelaciones (-5 por evento)
- Retrasos (-0.5 por evento)
- Overbooking (-1 por evento)
- Rutas en baja demanda (-0.5/día)

**Efecto:** Demanda × load factor × reputation/100

### 5. **Hubs**
- **Slots**: Limitados por nivel (nivel 1 = 2 slots)
- **Fee diario**: $5k-$20k según tamaño + ocupación
- **Desbloqueos**: Nivel → acceso a rutas nuevas
- **Hub efficiency**: Bonus costos operativos por rutas conectadas

### 6. **Competencia (IA)**
- **2-4 rivales** por ruta según importancia
- **Reaccionan a:** Precios, tu reputación
- **NO pueden:** Bloquearte rutas, sabotarte
- **Ceden si:** Dominas 15%+ del mercado en esa ruta
- **Inteligencia:** Suben/bajan precios ±10% mensual si ganan/pierden

### 7. **Eventos Planificados** (Semana 2)
**12 tipos** con duración 1-14 días:
- **Positivos**: Festival (+25% demanda, $0 coste)
- **Negativos**: Strike (-30% demanda, +20% costos)
- **Oportunidad**: Nueva conferencia en ciudad (+15% demanda premium)
- **Amenaza**: Fuel spike (+50% combustible)

**Probabilidad:** 0.5%-8% diario (sin control del jugador, natural)

### 8. **Penalidades Operacionales** (Semana 2)
- **Delays**: 2% + condition-based → -0.5 rep, $2k+ coste
- **Cancellations**: 0.5% + condition-based → -5 rep, $5k coste
- **Overbooking**: Load factor > seats → -1 rep, $3k coste
- **Maintenance emergency**: Raro → $8k coste

### 9. **Fuel Hedging** (Semana 3)
- **Contratos**: Precio fijo por 30/60/90/180 días
- **Volumen**: 10k-500k L
- **Uso automático**: Si hay activo, se consume primero
- **Protección**: Si combustible sube 30%, ahorras 15-20% vs mercado

---

## ⏱️ D. TIEMPO Y ESCALA

### Velocidades de Tiempo
- **1x**: 1 hora real = 1 hora juego (1 día/24 min)
- **2x**: 1 hora real = 2 horas juego (1 día/12 min)
- **5x**: 1 hora real = 5 horas juego (1 día/4.8 min)
- **20x**: 1 hora real = 20 horas juego (1 día/1.2 min)
- **Pausa**: Espacio

### Escala de Progresión
| Duración | Meta | Hito |
|----------|------|------|
| 1-3 días | $5M | Primera ruta rentable |
| 1 semana | $50M | 3-5 rutas, 2 hubs |
| 2 semanas | $200M | Flota 5-8 aviones, demina región |
| 1 mes | $1B+ | Global dominance, full hubs |

### Curve de Juego
```
Días 1-3:   Curva de aprendizaje (poca presión)
Días 4-14:  Decisiones importan (tensión + control)
Semana 3+:  Dominio (sensación de poder)
Mes 2+:     ??? (TBD - endgame infinito o misiones)
```

---

## 💸 E. ECONOMÍA (Alto Nivel)

### Ingresos
| Fuente | Típico | Variación |
|--------|--------|-----------|
| Rutas (gross) | $100k/día | ±40% (eventos, precios) |
| Eventos bonus | $20k/día | Raro |
| **TOTAL** | **$120k/día** | **80k-160k** |

### Gastos
| Concepto | % del Ingreso | Impactable |
|----------|---------------|-----------|
| Combustible | 40% | ✅ Hedging, envejecimiento |
| Crew | 25% | ❌ Fijo |
| Hub fees | 15% | ✅ Hub level, densidad |
| Mantenimiento | 10% | ✅ Envejecimiento, accidentes |
| Otros | 10% | ✅ Penalidades |
| **Margen neto** | **40%** | **35-50%** |

### Decisiones que Más Impactan el Dinero
1. **Precio de ruta** (+/-20% ingresos)
2. **Número de rutas** (+10% dinero por ruta nueva si viable)
3. **Fuel contracts** (-5 a +10% gastos según volatilidad)
4. **Mantenimiento timing** (Bad condition = +50% costos → prevenir = ahorro)
5. **Hub efficiency** (Bonificación -5% costos si densidad alta)

### Fin de Dinero
- **Compra de aviones**: $50M-$500M por flota de 5-10
- **Hub upgrades**: $2M-$20M cada uno
- **Contratos de combustible**: $40k-$400k por contrato
- **Corporates contracts** (futuro): Variable, algunos requieren garantía

---

## 🧑‍✈️ F. IA Y COMPETENCIA

### Capacidades de IA
| Aspecto | Capacidad | Limitaciones |
|---------|-----------|--------------|
| **Fijar precios** | ✅ Reaccionan a tu precio | ±10% max (no pueden dumping) |
| **Crear rutas** | ✅ Hacen rutas rentables | Solo 2-4 por región |
| **Reputación** | ✅ Tienen score | No afecta tu juego |
| **Bloqueo** | ❌ NO pueden bloquearte | Pueden competir, no más |
| **Sabotaje** | ❌ NO sabotean | Neutral |

### Tensión Real
- **Market share**: Si dominas 20%+ de ruta, IA puede irse
- **Price wars**: Si bajan precio, debes responder o pierdes load
- **Eventos**: Si hay festival, IA también lo aprovecha
- **Feedback**: Ves sus precios, debes reaccionar (táctico)

### Sensación de Control
✅ **Tienes agencia**: Tu precio importa, tu reputación importa
❌ **NO es por suerte**: Números son reales, no aleatorios

---

## 📖 G. PROGRESIÓN Y FINAL

### Qué es "Ganar"
**No hay "fin" definido.** El juego es sandbox progresivo:

| Fase | Objetivo | Sensación |
|------|----------|-----------|
| **Acto 1** (Semana 1) | 1ª ruta rentable | "Puedo hacerlo" |
| **Acto 2** (Semanas 2-3) | 5+ rutas, 3 hubs | "Domino una región" |
| **Acto 3** (Mes 1-2) | Red global, $1B | "Soy una potencia" |
| **Endgame** (Mes 2+) | ??? | "¿Y ahora qué?" |

### Desbloqueos por Progresión
- **Dinero**: Acceso a aviones más caros
- **Reputación**: Corporates contratos, eventos especiales
- **Level**: Nuevos hubs, nuevas regiones
- **Hub level**: Más slots, menores fees

### Cuándo se Siente Poderoso
1. **Día 3**: Ves 1ª ganancia real
2. **Día 7**: Expande a 2ª ruta (control)
3. **Semana 2**: Ve que precios importan (agencia)
4. **Semana 3**: Domina región vs IA (victoria)
5. **Mes 1**: $500M+ (poder absoluto)

### Endgame (Semana 4+)
**TBD - Opciones:**
- **Compra de aerolíneas**: Fusión con IA, expansión
- **Inversor externo**: Dinero ilimitado → nuevos retos
- **Competencia corporativa**: Contratos grandes requieren diligencia
- **Crisis**: Mercado se colapsa, resiliencia test
- **Sandbox infinito**: Solo crece, no hay techo

---

## 📊 ESTADO ACTUAL (Semana 2)

### ✅ Implementado
- Core economía (rutas, ingresos, gastos)
- Flota + mantenimiento + envejecimiento
- Reputación + hubs
- Eventos (12 tipos) + penalidades
- UI de elasticidad (slider precios)
- Yield optimization (asientos)
- Fuel hedging (sistema completo)
- Demand visibility (mercado vs tuyo)

### ⏳ Semana 3
- Hub efficiency bonus (-5-15% costos)
- Corporate contracts (revenue garantizado)
- Credit system (préstamos + interés)

### 🔮 Semana 4+
- Avanzada: Fusiones, expansión IA
- Corporates avanzado
- Misiones/challenges
- Endgame design

---

## 🧪 VALIDACIÓN DE DECISIONES

**Cuando dudes, pregunta:**

1. ¿Esto refuerza la fantasía de "tomar decisiones estratégicas"?
   - SÍ → Agregar
   - NO → Eliminar o rediseñar

2. ¿El jugador puede ver el impacto?
   - SÍ → Buena
   - NO → Necesita UI/feedback

3. ¿Hay tensión real (no solo números)?
   - SÍ → Mantener
   - NO → Es busywork

4. ¿Se puede jugar en 5-15 minutos?
   - SÍ → Buena sesión
   - NO → Demasiada microgestión

---

**Próxima sesión:** Validar esto, luego proceder con Semana 3 o ajustes.
