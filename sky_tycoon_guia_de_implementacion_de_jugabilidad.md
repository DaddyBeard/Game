# SkyTycoon – Documento de Diseño para Implementación de Jugabilidad

## 📌 Objetivo del documento
Este documento define **mejoras concretas de jugabilidad y diseño** que deben ser implementadas por la IA asistente en VS Code. No es un documento técnico, sino **directrices de diseño**, lógica de gameplay y comportamiento del juego.

El objetivo final es:
- Mejorar la retención del jugador
- Reducir la parálisis por análisis
- Aumentar la carga emocional y narrativa
- Hacer el progreso más satisfactorio y memorable

---

## 🎮 1. Core Loop Mejorado

### Core loop actual
- Comprar aviones
- Abrir rutas
- Generar ingresos
- Expandir aerolínea

### Problema detectado
El loop es funcional pero **poco emocional** y demasiado matemático.

### Implementación requerida
Añadir un **sistema de micro-objetivos**:

Ejemplos:
- "Abre tu primera ruta internacional"
- "Mantén beneficios durante 3 ciclos consecutivos"
- "Alcanza 80% de satisfacción del cliente"

Requisitos:
- Los micro-objetivos deben mostrarse siempre visibles en la UI
- Al completarse deben generar:
  - Feedback visual
  - Mensaje claro de logro
  - Pequeña recompensa (dinero, reputación o desbloqueo)

---

## 🧭 2. Desbloqueo Progresivo de Sistemas (Onboarding)

### Problema
Demasiados sistemas disponibles desde el inicio → confusión inicial.

### Implementación requerida
Aplicar **desbloqueo por niveles**:

| Nivel | Sistemas activos |
|-----|------------------|
| 1 | Rutas domésticas, 1 tipo de avión |
| 2 | Compra/venta de aviones |
| 3 | Costes operativos (combustible básico) |
| 4 | Mantenimiento |
| 5 | Competencia |
| 6 | Eventos narrativos |

Requisitos:
- El jugador debe recibir un mensaje cuando se desbloquea un sistema nuevo
- No mostrar UI de sistemas bloqueados

---

## 📈 3. Progreso y Momentos Memorables

### Objetivo
Crear sensación clara de **antes / después**.

### Implementación requerida
Añadir **hitos importantes**:

Ejemplos de hitos:
- Primera aeronave de gran capacidad
- Primera ruta internacional
- Primer gran beneficio
- Primera crisis evitada

Requisitos:
- Cada hito debe activar:
  - Ventana emergente
  - Texto narrativo corto
  - Recompensa simbólica

---

## ⚖️ 4. Decisiones con Riesgo (Trade-offs)

### Problema
Muchas decisiones actuales tienen una única respuesta óptima.

### Implementación requerida
Convertir decisiones económicas en **decisiones con riesgo**:

Ejemplos:
- Ruta muy rentable pero con alta probabilidad de cancelaciones
- Avión barato pero con peor satisfacción de clientes
- Ruta lejana con grandes beneficios pero costes imprevisibles

Requisitos:
- Mostrar riesgos de forma clara (iconos o texto)
- Resultados no siempre deterministas

---

## 🤖 5. Competencia con Personalidad

### Problema
La competencia es percibida como un número, no como rival.

### Implementación requerida
Crear aerolíneas IA con:
- Nombre
- Tipo (Low-cost, Premium, Regional, Agresiva)
- Comportamiento diferenciado

Ejemplos:
- Low-cost: abre rutas rápidamente y baja precios
- Premium: menos rutas, más estables

Requisitos:
- Mensajes cuando una aerolínea rival afecta directamente al jugador
- Impacto real en rutas compartidas

---

## 🎨 6. Feedback Visual y Psicológico

### Objetivo
Hacer que el jugador **sienta** las consecuencias.

### Implementación requerida
Añadir feedback inmediato:

Ejemplos:
- Ruta con problemas → icono rojo / mensaje negativo
- Ruta exitosa → icono dorado / mensaje positivo

Mensajes breves:
- "Pasajeros descontentos"
- "Ruta estrella"
- "Costes inesperados"

---

## 🔁 7. Rejugabilidad

### Implementación requerida
Añadir **modos de juego o escenarios**:

Ejemplos:
- Modo crisis: empiezas endeudado
- Modo desafío: objetivos con tiempo límite
- Modo libre: sandbox completo

Requisitos:
- Seleccionables desde el inicio
- Diferentes condiciones iniciales

---

## ✅ 8. Prioridades de Implementación

Orden recomendado:
1. Micro-objetivos
2. Desbloqueo progresivo
3. Feedback visual
4. Hitos narrativos
5. Competencia con personalidad
6. Modos de juego

---

## 📌 Nota Final para la IA en VS Code

- Priorizar experiencia del jugador sobre complejidad técnica
- Todo sistema nuevo debe explicar su impacto al jugador
- Mantener mensajes cortos y claros
- Evitar introducir múltiples sistemas complejos a la vez

---

**Fin del documento**

