# SISTEMA DE PROVEEDORES DE COMBUSTIBLE (EMPRESAS REALES)

Este documento define el **sistema completo de proveedores de combustible**, usando **empresas reales** y **contratos variables**, integrando y extendiendo:
- `fuel_system.md`
- `fuel_rules_patch.md`

Este archivo es **fuente de verdad** para Copilot y sustituye cualquier lógica previa de proveedores abstractos.

---

## 🎯 OBJETIVO DEL SISTEMA

- Usar **empresas reales** para aumentar inmersión
- Evitar proveedores dominantes
- Garantizar decisiones estratégicas reales
- Mantener balance a largo plazo

Principio clave:
> La empresa define la narrativa. El mercado define la oferta.

---

## 🏢 EMPRESAS DISPONIBLES

El juego incluye **exactamente tres proveedores globales**:

1. **Shell Aviation**
2. **BP Air**
3. **TotalEnergies Aviation**

No se deben añadir más proveedores sin rediseñar el sistema.

---

## 🧠 IDENTIDAD NARRATIVA (NO MECÁNICA)

| Empresa | Personalidad percibida |
|------|------------------------|
| Shell | Conservadora, robusta |
| BP | Adaptable, oportunista |
| TotalEnergies | Competitiva, agresiva |

⚠️ Estas identidades **no garantizan** mejores condiciones.

---

## 🛢️ PERFILES DE CONTRATO (ARQUETIPOS)

Los contratos se generan a partir de **perfiles**, no empresas fijas.

### 🟢 Estable
- Precio: ligeramente superior al mercado
- Volatilidad: baja
- Penalización ruptura: baja
- Duraciones: largas

### 🟡 Agresivo
- Precio inicial: bajo
- Penalizaciones: altas
- Cláusulas rígidas
- Alto riesgo

### 🔵 Flexible
- Precio: medio-alto
- Volumen ajustable
- Duraciones cortas
- Alta adaptabilidad

---

## 🔄 ROTACIÓN DE OFERTAS

### Regla general
- Cada empresa **alterna su perfil de contrato**
- La rotación ocurre cada **30–60 días**

### Factores que influyen
- Estado del mercado (Estable, Volátil, Crisis)
- Eventos activos
- Nivel del jugador

Ejemplo:
- Shell puede ofrecer Flexible durante un mercado volátil
- TotalEnergies puede ofrecer Estable tras una crisis

---

## 🔓 DESBLOQUEO POR NIVEL

| Nivel | Acceso |
|------|-------|
| 1–2 | Mercado spot + 1 proveedor activo |
| 3–4 | 2 proveedores activos |
| 5–6 | 3 proveedores activos |
| 7–10 | Contratos personalizados |

---

## ⚖️ REGLAS DE BALANCE (OBLIGATORIAS)

- Ningún proveedor es siempre óptimo
- Ningún perfil es siempre beneficioso
- El mercado pesa más que la marca
- No existe proveedor premium

---

## 🚨 REGLAS PROHIBIDAS

Copilot NO DEBE implementar:
- Proveedores fijos por perfil
- Bonificaciones ocultas por empresa
- Contratos ilimitados
- Auto-renew
- Optimización automática

---

## 🤖 IA Y PROVEEDORES

- La IA ve las mismas ofertas que el jugador
- La IA:
  - Elige contratos simples
  - Puede equivocarse
- La IA nunca recibe descuentos ocultos

---

## 📊 INFORMACIÓN MOSTRADA AL JUGADOR

Siempre visible:
- Empresa
- Perfil actual
- Precio por litro
- Duración
- Volumen
- Riesgo estimado

Nada oculto.

---

## 🛠 USO PARA COPILOT

Antes de generar código de combustible:
1. Leer este archivo
2. Respetar `fuel_system.md` y `fuel_rules_patch.md`
3. Aplicar rotación de perfiles
4. Evitar lógica determinista

---

## 🧠 PRINCIPIO FINAL

> El jugador debe elegir entre **marcas familiares con condiciones cambiantes**,
> no entre números óptimos.

Este documento define el sistema completo de proveedores de combustible con empresas reales.

