# FUEL RULES PATCH v1.1 — SKYTYCOON

Este documento **extiende y corrige** el sistema definido en `fuel_system.md`.

Su objetivo es **cerrar vacíos de diseño** detectados en la implementación inicial y garantizar que el sistema de combustible:
- Fuerce decisiones activas
- No se automatice en exceso
- Mantenga tensión estratégica a medio y largo plazo

Copilot **DEBE** aplicar estas reglas además de `fuel_system.md`.

---

## 🎯 OBJETIVO DEL PATCH

Corregir cuatro riesgos principales:
1. Automatización pasiva del combustible
2. Contratos sin coste de oportunidad
3. Combustible desconectado de la IA
4. Falta de impacto en crisis prolongadas

Principio rector:
> El combustible debe seguir siendo una preocupación estratégica incluso en late game.

---

## 1️⃣ DECISIÓN VS AUTOMATIZACIÓN

### Regla obligatoria
- **NO** existe auto-renovación de contratos
- Todo contrato expirado requiere una **decisión explícita** del jugador

### Alertas de combustible
El sistema debe generar notificaciones cuando:
- El precio spot varía ±10% en ≤5 días
- El mercado cambia de estado (Estable → Volátil, etc.)
- Un contrato está a ≤5 días de expirar

Estas alertas:
- No bloquean el juego
- Dirigen al panel Combustible

---

## 2️⃣ COSTE DE OPORTUNIDAD Y LIQUIDEZ

### Regla de liquidez
- El dinero usado en contratos de combustible **queda bloqueado**
- No puede usarse para:
  - Comprar aviones
  - Expandir hubs
  - Firmar otros contratos

### Impacto implícito
- Cuanto mayor el volumen contratado:
  - Menor flexibilidad operativa
  - Mayor riesgo si el mercado baja

Principio:
> Un contrato protege el margen, pero reduce la agilidad.

---

## 3️⃣ INTEGRACIÓN CON IA

### Uso de combustible por la IA
- Todas las aerolíneas IA están sujetas al mismo precio spot
- A partir de nivel 4:
  - La IA puede usar contratos simples

### Comportamiento IA
- IA conservadora:
  - Prefiere contratos estables
- IA agresiva:
  - Usa spot o contratos cortos

### Regla
> La IA NO optimiza, solo **participa** del sistema.

---

## 4️⃣ CRISIS DE COMBUSTIBLE PROLONGADAS

### Definición de crisis
- Precio spot ≥ +25% del base
- Duración ≥ 45 días

### Efectos sistémicos
Durante una crisis:
- Rutas con margen bajo se vuelven inviables
- Penalización acumulativa a aerolíneas sin contratos
- Los contratos activos ganan valor estratégico

### Salida de crisis
- El mercado vuelve gradualmente a estado Estable o Bajista
- No hay "snap-back" inmediato

---

## 5️⃣ LÍMITES Y RESTRICCIONES

### Contratos
- Máximo contratos activos:
  - Early game: 1
  - Mid game: 2
  - Late game: 3

- Cobertura máxima:
  - Nunca más del 85% del consumo estimado

- Contratos:
  - No se solapan automáticamente
  - No se fusionan

---

## 🚨 REGLAS DE BLOQUEO (PROHIBIDO)

Copilot NO DEBE implementar:
- Auto-renew
- Contratos infinitos
- Ajuste automático "óptimo"
- Proveedores claramente dominantes
- Ignorar contratos de la IA

---

## 🛠 VALIDACIÓN TÉCNICA

Antes de considerar el sistema válido:
- Simular 90 días con:
  - Sin contratos
  - Contratos buenos
  - Contratos malos

Verificar:
- Variación real en decisiones
- Impacto visible en costes
- No colapso económico

---

## 🧠 PRINCIPIO FINAL DEL PATCH

> Si el jugador puede "configurar y olvidar" el combustible,
> el sistema ha fallado.

Este patch es obligatorio para cualquier implementación del sistema de combustible.

