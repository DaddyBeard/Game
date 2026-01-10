# Dev Panel Guide - SkyTycoon Testing

## Cómo Usar el Dev Panel

### Abrir el Panel
**Atajo**: `Ctrl + D`

Se abrirá un panel en la esquina inferior izquierda con controles para modificar valores de testing.

### Controles Disponibles

#### 1. **Nivel (1-10)**
- **Rango**: 1 a 10
- **Efecto**: Cambia instantáneamente tu nivel de progresión
- **Para testear**: 
  - Desbloqueos de aeronaves
  - Requisitos de cada nivel
  - Cambios en UI según nivel
  - Capacidad de abrir hubs secundarios

#### 2. **Dinero**
- **Rango**: $0 - $999M
- **Medida**: Millones (ingresa número entre 0-999)
- **Para testear**:
  - Compra de aviones
  - Aperturas de hubs
  - Mejoras de hubs
  - Impacto de costos

#### 3. **Reputación**
- **Rango**: 0 - 100
- **Efecto**: Afecta cálculo de ocupación inmediatamente
- **Para testear**:
  - Factor de carga dinámico
  - Alertas por reputación baja
  - Impacto en ingresos

#### 4. **Botones de Acción**

**🔄 Reset Game**
- Reinicia el juego completamente
- Borra todos los datos (requiere confirmación)
- Te lleva a la pantalla de selección de hub
- Úsalo para empezar una nueva partida limpia

**✕ Cerrar**
- Cierra el panel de dev sin afectar nada

### Información Mostrada
- ✈️ Flota actual: Cantidad de aviones
- 🗺️ Rutas activas: Cantidad de rutas operativas
- Nivel, dinero y reputación en tiempo real

---

## Flujo de Testing Recomendado

### Test 1: Progresión de Niveles
1. Abre Dev Panel (`Ctrl+D`)
2. Coloca Nivel = 1
3. Coloca Dinero = $100M
4. Coloca Reputación = 50
5. Cierra panel (Reset Game si quieres limpiar)
6. **Prueba**:
   - Compra un avión (A320)
   - Crea una ruta
   - Observa tips apareciendo
   - Modifica nivel a 2 desde panel → verifica cambios en UI

### Test 2: Sistema de Reputación
1. Abre Dev Panel
2. Coloca Reputación = 20 (baja)
3. Observa alerta en dashboard
4. Aumenta a 50 → ve cómo cambia factor de ocupación
5. Aumenta a 100 → máxima ocupación visible

### Test 3: Hubs Secundarios
1. Abre Dev Panel
2. Coloca Nivel = 2 (desbloquea hubs)
3. Coloca Dinero = $50M
4. Cierra panel
5. En dashboard, debería aparecer botón "Abrir Hub Secundario"
6. Intenta abrir hub secundario

### Test 4: Aeronaves por Nivel
1. Abre Dev Panel
2. Coloca Nivel = 1 → ve qué aviones están disponibles en Mercado
3. Cambia a Nivel = 5 → más aviones desbloqueados
4. Cambia a Nivel = 10 → todos desbloqueados

### Test 5: Impacto de Dinero
1. Abre Dev Panel
2. Coloca Dinero = $1M (bajo)
3. Intenta comprar avión o abrir hub (debe fallar)
4. Coloca Dinero = $100M
5. Intenta de nuevo (debe funcionar)

---

## Atajos de Teclado Disponibles

| Atajo | Función |
|-------|---------|
| `Ctrl+D` | Abre/Cierra Dev Panel |
| `Espacio` | Pausa/Resume |
| `1` | Velocidad 1x |
| `2` | Velocidad 2x |
| `3` | Velocidad 5x |

---

## Debugging en Consola

El Dev Panel también registra cambios en la consola:

```
🔧 Dev: Level set to 5
🔧 Dev: Money set to $250,000,000
🔧 Dev: Reputation set to 75
```

Usa F12 → Console para ver logs detallados de lo que sucede.

---

## Notas Importantes

- **Cambios Guardados**: Todos los cambios se guardan automáticamente en IndexedDB
- **Sin Recargar**: No necesitas recargar la página para ver cambios
- **Hot-Fix**: Cambios en nivel/dinero/reputación se aplican instantáneamente
- **Reset Destructivo**: El botón Reset Game es destructivo (requiere confirmación)

---

## Casos de Test por Fase

### Fase 1: Hubs
- ✅ Selección correcta de hub inicial
- ✅ Capital varía por hub
- ✅ Slots funcionan correctamente
- ✅ Cuotas diarias se restan

### Fase 2: Reputación
- ✅ Factor de carga sube con reputación
- ✅ Alerta aparece si < 30
- ✅ Ingresos varían dinámicamente

### Fase 3: Rivales
- ✅ Ranking muestra posición correcta
- ✅ Competencia afecta ocupación

### Fase 4: Niveles
- ✅ Level-up al cumplir requisitos
- ✅ Desbloqueos correctos por nivel
- ✅ Dashboard muestra checklist

### Fase 5: Hubs Secundarios
- ✅ Disponible desde nivel 2
- ✅ Requiere $10M
- ✅ Se crea correctamente

### Fase 6: UI
- ✅ Tips aparecen en hitos
- ✅ Dashboard actualiza
- ✅ Alertas funcionan

---

## Troubleshooting

**Dev Panel no aparece**
- Asegúrate de que no estés escribiendo en un input (Ctrl+D se ignora)
- Prueba recargar la página
- Abre Console (F12) para ver errores

**Cambios no se guardan**
- Verifica que el botón de Cerrar esté desactivado
- Revisa Console para mensajes de error en IndexedDB

**Performance lento después de cambios**
- Intenta usar Reset Game para limpiar estado
- Verifica que no haya rutas/aviones acumulándose

---

## Próximos Tests

Basándote en esto, procede con:

1. **Test Nivel 1 → Nivel 2**: Verifica desbloqueos
2. **Test Hubs**: Crea múltiples hubs, abre mejoras
3. **Test Rutas**: Crea rutas desde/hacia diferentes hubs
4. **Test Economía**: Revisa cálculos de ingresos/gastos

¡Buen testing! 🚀
