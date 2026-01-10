# SISTEMA DE CONTRATOS CORPORATIVOS — SKYTYCOON

Este documento define el **sistema de Contratos Corporativos** como una **mecánica central de juego**, integrada con el sistema de **niveles del jugador (1–10)**.

Los contratos NO son endgame exclusivo: evolucionan con el progreso del jugador y cambian su rol a medida que sube de nivel.

Copilot debe usar este documento como **fuente de verdad** para implementar, equilibrar y extender esta mecánica.

---

## 🎯 OBJETIVO DE LOS CONTRATOS CORPORATIVOS

Los Contratos Corporativos sirven para:
- Introducir decisiones estratégicas desde early game
- Ofrecer **ingresos alternativos** a las rutas tradicionales
- Forzar trade-offs claros (estabilidad vs flexibilidad)
- Guiar la progresión del jugador por niveles

Principio clave:
> Un contrato **nunca** debe ser obligatorio, pero **siempre** debe ser tentador.

---

## 🧠 FILOSOFÍA DE DISEÑO

- Los contratos:
  - Limitan libertad a cambio de estabilidad
  - Penalizan la mala planificación
  - Premian consistencia, no microgestión

- NO son:
  - Dinero gratis
  - Misiones scripted sin impacto
  - Sustituto de rutas normales

---

## 🧩 ESTRUCTURA COMÚN DE UN CONTRATO

Todo contrato tiene:
- Nivel mínimo requerido
- Duración (días)
- Ingreso garantizado
- Requisitos operativos
- Penalizaciones claras
- Recompensa secundaria (reputación, desbloqueos)

---

## 📈 CONTRATOS POR NIVEL

### 🟢 NIVELES 1–2 — CONTRATOS LOCALES (INTRODUCCIÓN)

**Objetivo:** Enseñar la mecánica sin castigar en exceso.

- Tipo: Empresas locales / Gobiernos regionales
- Duración: 7–14 días
- Ingreso: Bajo–medio (10–20% del ingreso diario típico)
- Requisitos:
  - 1 ruta activa
  - Puntualidad básica
- Penalización:
  - Pérdida leve de reputación

📌 Diseño:
> Sirven como tutorial económico con red de seguridad.

---

### 🟡 NIVELES 3–4 — CONTRATOS REGIONALES

**Objetivo:** Introducir restricciones reales.

- Tipo: Grupos empresariales regionales
- Duración: 14–30 días
- Ingreso: Medio (20–35%)
- Requisitos:
  - 2–3 rutas activas
  - Precio estable
  - Reputación mínima
- Penalización:
  - Multa económica
  - Impacto moderado en reputación

📌 Diseño:
> El jugador empieza a sacrificar flexibilidad.

---

### 🟠 NIVELES 5–6 — CONTRATOS NACIONALES

**Objetivo:** Forzar planificación estructural.

- Tipo: Gobiernos nacionales / Grandes corporaciones
- Duración: 30–60 días
- Ingreso: Medio–alto (35–50%)
- Requisitos:
  - Hub activo
  - Flota mínima
  - Puntualidad alta
- Penalización:
  - Multa severa
  - Reputación negativa persistente

📌 Diseño:
> Aquí los contratos ya condicionan el diseño de la aerolínea.

---

### 🔵 NIVELES 7–8 — CONTRATOS MULTINACIONALES

**Objetivo:** Cambiar el enfoque del jugador a estabilidad corporativa.

- Tipo: Multinacionales / Organismos supranacionales
- Duración: 60–90 días
- Ingreso: Alto (50–70%)
- Requisitos:
  - Múltiples hubs
  - Flota moderna
  - Cancelaciones mínimas
- Penalización:
  - Cancelación forzada del contrato
  - Gran caída de reputación

📌 Diseño:
> El jugador ya opera como corporación, no como aerolínea pequeña.

---

### 🔴 NIVELES 9–10 — CONTRATOS ESTRATÉGICOS GLOBALES

**Objetivo:** Preparar transición a endgame.

- Tipo: Estados, ONU, macro-eventos globales
- Duración: 90–180 días
- Ingreso: Muy alto (70–90%)
- Requisitos:
  - Dominio regional
  - Excelente reputación
  - Alta resiliencia operativa
- Penalización:
  - Crisis reputacional
  - Eventos negativos encadenados

📌 Diseño:
> No son contratos de dinero, son **apuestas estratégicas**.

---

## 🔄 REGLAS GLOBALES DEL SISTEMA

- Máximo de contratos activos:
  - Early game: 1
  - Mid game: 2
  - Late game: 3

- Un contrato puede:
  - Bloquear rutas
  - Forzar prioridades
  - Chocar con otros contratos

- Romper voluntariamente un contrato:
  - Siempre tiene consecuencias
  - Nunca es gratis

---

## ⚖️ BALANCE Y CONTROL

- Los contratos no deben superar el 90% de ingresos totales
- Siempre debe existir al menos una ruta libre
- El jugador debe poder **rechazar sin penalización**

---

## 🧠 REGLA DE ORO

> Si aceptar un contrato no cambia cómo juega el jugador,
> **ese contrato está mal diseñado**.

---

## 🛠 USO PARA COPILOT

Antes de generar código sobre contratos:
- Leer este documento
- Detectar el nivel del jugador
- Ajustar restricciones y recompensas
- Garantizar trade-offs visibles

Este archivo define el comportamiento esperado del sistema de Contratos Corporativos.

