# SkyTycoon – Diseño de Situaciones y Misiones de Micro‑Objetivos

## 📌 Propósito del documento

Este documento define **situaciones completas, concretas y reutilizables** para el sistema de micro‑objetivos. Está diseñado para que una IA o desarrollador:
- No tenga que inventar misiones
- Solo traduzca estas situaciones a lógica del juego
- Mantenga coherencia narrativa, mecánica y de progresión

Cada micro‑objetivo se define como una **situación jugable**, no solo como una tarea.

---

## 🧠 Estructura estándar de una situación

Cada situación debe implementarse siguiendo esta estructura:

- **ID**
- **Nombre visible**
- **Contexto narrativo** (1–2 frases)
- **Condición de activación**
- **Objetivo principal**
- **Criterios de éxito**
- **Criterios de fallo** (si aplica)
- **Duración esperada**
- **Recompensa**
- **Consecuencia narrativa**

---

## 🟢 BLOQUE 1 – EARLY GAME (Onboarding guiado)

### M1 – "Nuestro primer avión"

- **ID:** M1_FIRST_PLANE
- **Contexto:** La aerolínea aún no tiene flota. No hay negocio sin aviones.
- **Activación:** Aviones = 0
- **Objetivo:** Comprar cualquier avión disponible
- **Éxito:** 1 avión en propiedad
- **Fallo:** No aplica
- **Duración:** 1–2 minutos
- **Recompensa:** Reputación + pequeño bonus económico
- **Consecuencia:** Desbloquea misiones de rutas

---

### M2 – "La primera ruta"

- **ID:** M2_FIRST_ROUTE
- **Contexto:** Un avión parado es dinero perdido. Es hora de volar.
- **Activación:** Aviones ≥ 1 AND Rutas = 0
- **Objetivo:** Abrir una ruta doméstica
- **Éxito:** Ruta activa
- **Fallo:** No aplica
- **Duración:** 2–3 minutos
- **Recompensa:** Ingresos iniciales + tutorial de beneficios
- **Consecuencia:** Comienza el ciclo económico

---

### M3 – "El primer beneficio"

- **ID:** M3_FIRST_PROFIT
- **Contexto:** No basta con volar, hay que ganar dinero.
- **Activación:** Ruta activa ≥ 1
- **Objetivo:** Obtener beneficio neto positivo en un ciclo
- **Éxito:** Balance > 0
- **Fallo:** No aplica
- **Duración:** 3–5 minutos
- **Recompensa:** Acceso a segundo avión
- **Consecuencia:** Se presenta el concepto de rentabilidad

---

## 🟡 BLOQUE 2 – MID GAME (Consolidación y expansión)

### M4 – "Más allá de casa"

- **ID:** M4_INTERNATIONAL
- **Contexto:** El mercado local se queda pequeño.
- **Activación:** Nivel ≥ 3 AND Beneficios estables
- **Objetivo:** Abrir primera ruta internacional
- **Éxito:** Ruta internacional activa
- **Fallo:** Pérdidas severas
- **Duración:** 5–8 minutos
- **Recompensa:** Reputación internacional + bonus
- **Consecuencia:** Se desbloquean rutas largas

---

### M5 – "Crecimiento controlado"

- **ID:** M5_CONTROLLED_GROWTH
- **Contexto:** Crecer demasiado rápido puede destruir una aerolínea.
- **Activación:** Rutas ≥ 3
- **Objetivo:** Mantener beneficios durante 3 ciclos
- **Éxito:** 3 ciclos consecutivos positivos
- **Fallo:** 1 ciclo negativo
- **Duración:** 6–10 minutos
- **Recompensa:** Reducción temporal de costes
- **Consecuencia:** Introduce estabilidad como mecánica

---

## 🔴 BLOQUE 3 – MID/LATE GAME (Riesgo y decisiones)

### M6 – "Ruta problemática"

- **ID:** M6_BAD_ROUTE
- **Contexto:** Una ruta genera ingresos, pero los pasajeros no están contentos.
- **Activación:** Satisfacción < 60% en una ruta
- **Objetivo:** Recuperar la rentabilidad sin cerrar la ruta
- **Éxito:** Beneficios ≥ 0 durante 2 ciclos
- **Fallo:** Cierre de la ruta
- **Duración:** 5–10 minutos
- **Recompensa:** Reputación + experiencia
- **Consecuencia:** Enseña gestión de crisis

---

### M7 – "La competencia ataca"

- **ID:** M7_COMPETITOR_ATTACK
- **Contexto:** Una aerolínea rival entra en tu mercado principal.
- **Activación:** Ruta compartida con competidor
- **Objetivo:** Mantener beneficios en esa ruta
- **Éxito:** Beneficio positivo tras 2 ciclos
- **Fallo:** Beneficio negativo
- **Duración:** 5–8 minutos
- **Recompensa:** Reputación corporativa
- **Consecuencia:** Humaniza a la IA rival

---

## ⚫ BLOQUE 4 – LATE GAME (Maestría)

### M8 – "Crisis operacional"

- **ID:** M8_OPERATIONAL_CRISIS
- **Contexto:** Un aumento de costes amenaza la estabilidad.
- **Activación:** Evento aleatorio de costes
- **Objetivo:** Evitar pérdidas globales
- **Éxito:** Balance positivo tras crisis
- **Fallo:** Deuda excesiva
- **Duración:** 8–12 minutos
- **Recompensa:** Gran bonus de reputación
- **Consecuencia:** Refuerza la sensación de liderazgo

---

## 📌 Reglas globales del sistema de misiones

- Solo una misión principal activa
- Nunca repetir la misma misión base
- Adaptar valores numéricos al estado del jugador
- Mostrar siempre el contexto narrativo al activarse

---

## ✅ Resultado esperado

Este sistema debe generar:
- Guía constante sin imponer
- Ritmo controlado
- Variedad sin complejidad artificial
- Sensación de historia emergente

---

**Fin del documento**

