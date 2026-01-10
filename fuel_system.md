# SISTEMA DE COMBUSTIBLE — SKYTYCOON

Este documento define el **Sistema de Combustible** como una **mecánica económica central** del juego *SkyTycoon*.

El combustible es uno de los **principales costes operativos** y debe influir directamente en:
- Rentabilidad de rutas
- Toma de decisiones estratégicas
- Gestión del riesgo

Copilot debe usar este archivo como **fuente de verdad** al generar cualquier lógica relacionada con:
- Precio del combustible
- Consumo
- Contratos con distribuidores (fuel hedging)
- Impacto económico y eventos

---

## 🎯 OBJETIVO DEL SISTEMA DE COMBUSTIBLE

El sistema de combustible existe para:
- Introducir **volatilidad controlada** en la economía
- Forzar decisiones de riesgo vs estabilidad
- Evitar economías lineales o predecibles

Principio clave:
> El combustible nunca debe ser un coste fijo invisible. Siempre debe sentirse.

---

## 🛢️ PRECIO DE MERCADO DEL COMBUSTIBLE

### Naturaleza del precio
- Existe un **precio global de mercado**
- Aplica a todas las aerolíneas
- Afecta todas las rutas activas

### Fluctuación del precio
- El precio cambia **diariamente**
- Variación base: ±1% a ±3%
- Puede haber:
  - Tendencias (subidas/bajadas sostenidas)
  - Picos puntuales por eventos

### Precio base sugerido
- Precio inicial: **$1.00 por litro** (unidad abstracta)
- El valor es relativo, no realista al céntimo

### Reglas
- El precio **no es manipulable** por el jugador
- El jugador solo puede **reaccionar o cubrirse**

---

## 📈 TENDENCIAS DE MERCADO

El mercado puede entrar en estados:
- **Estable**: Variaciones pequeñas
- **Alcista**: Subidas progresivas durante varios días
- **Bajista**: Bajadas progresivas
- **Volátil**: Cambios bruscos e imprevisibles

### Duración típica
- 7 a 30 días

### Regla de diseño
> El jugador debe poder **identificar una tendencia**, nunca adivinar a ciegas.

---

## 🤝 CONTRATOS CON DISTRIBUIDORES (FUEL HEDGING)

### Descripción
Contratos para asegurar combustible a **precio fijo** durante un tiempo determinado.

### Características generales
- Precio fijado al firmar el contrato
- Volumen máximo definido
- Duración limitada
- Uso automático si está activo

### Duraciones disponibles
- 30 días
- 60 días
- 90 días
- 180 días

### Volumen
- Escala según tamaño de la aerolínea
- Ejemplo: 10k – 500k litros

---

## ⚖️ RIESGO VS RECOMPENSA

### Escenario 1 — Buen contrato
- Mercado sube
- Jugador paga menos
- Ahorro visible

### Escenario 2 — Mal contrato
- Mercado baja
- Jugador queda atado a precio alto
- Pérdida de oportunidad

### Regla
> Los contratos pueden ser una bendición o un error estratégico.

---

## 🔓 DESBLOQUEO POR NIVEL

| Nivel | Acceso a combustible |
|------|-----------------------|
| 1–2 | Solo mercado spot |
| 3–4 | Contratos de 30 días |
| 5–6 | Contratos de 60–90 días |
| 7–8 | Contratos grandes (alto volumen) |
| 9–10 | Contratos estratégicos (180 días, mejores condiciones) |

---

## 🌍 EVENTOS RELACIONADOS CON COMBUSTIBLE

Ejemplos:
- Conflicto geopolítico → +30% precio
- Exceso de producción → -20% precio
- Regulación ambiental → Tendencia alcista

Eventos:
- Afectan tanto a mercado como a contratos
- No cancelan contratos activos

---

## 📊 IMPACTO ECONÓMICO

- El combustible representa:
  - ~40% de los costes operativos

- Afecta directamente:
  - Margen de rutas
  - Rentabilidad global
  - Decisiones de expansión

---

## ⚠️ REGLAS DE ORO

- El combustible nunca debe ser ignorado
- No debe dominar el 100% del gameplay
- El jugador siempre debe ver:
  - Precio actual
  - Precio contrato
  - Diferencia clara

---

## ❌ SISTEMAS PROHIBIDOS

- Manipulación directa de mercado
- Contratos infinitos
- Precios ocultos
- Automatización total sin feedback

---

## 🛠 USO PARA COPILOT

Antes de generar lógica de combustible:
- Leer este documento
- Aplicar fluctuaciones diarias
- Diferenciar mercado vs contrato
- Mostrar impacto claro en costes

---

## 🧠 PRINCIPIO FINAL

> Si el jugador no cambia decisiones por el precio del combustible,
> el sistema está mal implementado.

Este documento define el comportamiento esperado del sistema de Combustible.

