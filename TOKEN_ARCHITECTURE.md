# 🎨 Token Architecture - Semantic vs Primitive

## 📚 Problemas Identificados y Resueltos

### Problema 1: Uso de Tokens Primitivos
Al inspeccionar el código, se detectó que el valor hexadecimal aplicado (`#18181b`) no coincidía con el valor esperado del Strata Design System.

**Causa raíz:** Uso de **tokens primitivos** en lugar de **tokens semánticos**.

### Problema 2: Valores Incorrectos en Tokens Primitivos
Los valores de `zinc-900` y `zinc-800` en el código no coincidían con los valores mostrados en la documentación visual de Strata:
- **Código anterior:** `zinc-900: #18181b`, `zinc-800: #27272a`
- **Visual de Strata:** `zinc-900: #02060C`, `zinc-800: #141E2C`

**Causa raíz:** Los tokens primitivos en `tokens/primitives/colors.json` tenían valores incorrectos que no coincidían con la documentación visual.

### Problema 3: Mapeo Semántico Incorrecto
Los tokens semánticos en modo oscuro usaban colores de la paleta `mono` en lugar de la paleta `zinc`:
- `card` → `{color.mono.offBlack}` (#0B0B0C) ❌
- `secondary` → `{color.mono.deepGraphite}` (#1E1E22) ❌

**Solución:** Se actualizaron los mapeos semánticos para usar colores `zinc` con los valores correctos.

---

## 🏗️ Arquitectura de Tokens

Strata Design System sigue una arquitectura de **3 niveles**:

```
Primitivos → Semánticos → Componentes
zinc-900     card         Card, Dialog, etc.
zinc-800     secondary    Internal elements
```

### ❌ Tokens Primitivos (NO usar directamente)

Los tokens primitivos son valores base de la paleta de colores. **NO deben usarse directamente en componentes.**

#### Valores Corregidos (Dark Mode)
| Token | Valor Correcto | Valor Anterior ❌ | Estado |
|-------|----------------|-------------------|--------|
| `zinc-900` | `#02060C` | `#18181b` | ✅ Corregido |
| `zinc-800` | `#141E2C` | `#27272a` | ✅ Corregido |

#### Valores Corregidos (Light Mode)
| Token | Valor Correcto | Valor Anterior ❌ | Estado |
|-------|----------------|-------------------|--------|
| `zinc-50` | `#fafafa` | `#fafafa` | ✅ Ya correcto |
| `zinc-100` | `#EBECEE` | `#f4f4f5` | ✅ Corregido |
| `zinc-200` | `#E0E2E5` | `#e4e4e7` | ✅ Corregido |
| `zinc-500` | `#959DA7` | `#71717a` | ✅ Corregido |

**Nota:** Estos valores ahora coinciden con la documentación visual de Strata Design System.

### ✅ Tokens Semánticos (USAR siempre)

Los tokens semánticos se adaptan automáticamente a light/dark mode y definen **intención**, no color específico.

| Token | Light (Actualizado) | Mapeo Light | Dark (Actualizado) | Mapeo Dark | ✅ Uso |
|-------|---------------------|-------------|-------------------|------------|--------|
| `background` | `#EBECEE` | `zinc-100` | `#02060C` | `zinc-900` | Fondo de página |
| `card` | `#fafafa` | `zinc-50` | `#02060C` | `zinc-900` | Contenedores principales |
| `secondary` | `#fafafa` | `zinc-50` | `#141E2C` | `zinc-800` | Elementos internos, nested cards |
| `muted` | `#fafafa` | `zinc-50` | `#141E2C` | `zinc-800` | Fondos sutiles, disabled states |
| `border` | `#d4d4d8` | `zinc-300` | `#141E2C` | `zinc-800` | Bordes de elementos |

---

## 🎯 Jerarquía Visual Correcta

### Nivel 1: Contenedores Principales
```tsx
// ✅ CORRECTO - Usa token semántico
<div className="bg-card rounded-2xl border border-border shadow-sm p-6">
  {/* Contenido */}
</div>

// ❌ INCORRECTO - Usa token primitivo
<div className="bg-white dark:bg-zinc-900 rounded-2xl">
  {/* Contenido */}
</div>
```

**Valores aplicados:**
- Light: `#fafafa` (zinc-50) ✅
- Dark: `#02060C` (zinc-900) ✅

### Nivel 2: Elementos Internos
```tsx
// ✅ CORRECTO - Usa secondary para elementos nested
<div className="bg-card p-6">
  <div className="bg-secondary rounded-lg p-4">
    {/* Item card */}
  </div>
</div>

// ❌ INCORRECTO - Usa zinc-800
<div className="bg-white dark:bg-zinc-900 p-6">
  <div className="bg-white dark:bg-zinc-800 rounded-lg p-4">
    {/* Item card */}
  </div>
</div>
```

**Valores aplicados:**
- Light: `#fafafa` (zinc-50) con borde `#d4d4d8` (zinc-300) ✅
- Dark: `#141E2C` (zinc-800) ✅

---

## 🔧 Cambios Realizados en Dashboard

### 1. Contenedores Principales (4 secciones Follow up)

#### Antes
```tsx
<div className="bg-white dark:bg-zinc-900 rounded-2xl">
```

#### Después
```tsx
<div className="bg-card rounded-2xl">
```

**Secciones actualizadas:**
- Urgent Actions
- Recent Activity
- AI Suggestions
- Performance

### 2. Elementos Internos

#### Antes
```tsx
// Expandable sections
<div className="bg-white dark:bg-zinc-800 p-3">

// Activity items
<div className="bg-white dark:bg-zinc-800 rounded-xl">

// Suggestion cards
<div className="bg-zinc-50 dark:bg-zinc-800/50">

// Order cards
<div className="bg-white dark:bg-zinc-800 rounded-2xl">
```

#### Después
```tsx
// Expandable sections
<div className="bg-secondary p-3">

// Activity items
<div className="bg-secondary rounded-xl">

// Suggestion cards
<div className="bg-muted dark:bg-secondary/50">

// Order cards
<div className="bg-secondary rounded-2xl">
```

### 3. Otros Contenedores

- **Tools section:** `bg-card`
- **Recent Quotes:** `bg-card`
- **Placeholder widgets:** `bg-card`
- **Dialog modals:** `bg-card`

---

## 📊 Resultado Final

### Fase 1: Cambio a Tokens Semánticos ✅
```css
/* Antes - Tokens primitivos incorrectos */
.bg-zinc-900 {
  background-color: #18181b; /* ❌ Valor incorrecto */
}

/* Después - Tokens semánticos */
.bg-card {
  background-color: var(--color-card);
}
```

### Fase 2: Corrección de Valores Primitivos ✅
```json
// tokens/primitives/colors.json - Dark Mode
{
  "zinc": {
    "800": { "value": "#141E2C" }, // ✅ Corregido desde #27272a
    "900": { "value": "#02060C" }  // ✅ Corregido desde #18181b
  }
}

// tokens/primitives/colors.json - Light Mode
{
  "zinc": {
    "50": { "value": "#fafafa" },  // ✅ Ya estaba correcto
    "100": { "value": "#EBECEE" }, // ✅ Corregido desde #f4f4f5
    "200": { "value": "#E0E2E5" }, // ✅ Corregido desde #e4e4e7
    "500": { "value": "#959DA7" }  // ✅ Corregido desde #71717a
  }
}
```

### Fase 3: Actualización de Mapeos Semánticos ✅

#### Dark Mode
```json
// tokens/semantic/colors-dark.json
{
  "background": { "value": "{color.zinc.900}" },  // ✅ Ahora usa zinc-900
  "card": { "value": "{color.zinc.900}" },        // ✅ Ahora usa zinc-900
  "secondary": { "value": "{color.zinc.800}" },   // ✅ Ahora usa zinc-800
  "muted": { "value": "{color.zinc.800}" },       // ✅ Ahora usa zinc-800
  "border": { "value": "{color.zinc.800}" }       // ✅ Ahora usa zinc-800
}
```

#### Light Mode
```json
// tokens/semantic/colors.json
{
  "background": { "value": "{color.zinc.100}" },  // ✅ Ahora usa zinc-100 (antes mono.offWhite)
  "card": { "value": "{color.zinc.50}" },         // ✅ Ahora usa zinc-50 (antes mono.offWhite)
  "secondary": { "value": "{color.zinc.50}" },    // ✅ Ahora usa zinc-50 (antes zinc.200)
  "muted": { "value": "{color.zinc.50}" },        // ✅ Ahora usa zinc-50 (antes zinc.200)
  "border": { "value": "{color.zinc.300}" }       // ✅ Ahora usa zinc-300 (antes zinc.200)
}
```

### Resultado en el Navegador

#### Light Mode
```css
/* CSS Variables generadas */
:root {
  --color-zinc-50: #fafafa;
  --color-zinc-100: #EBECEE;
  --color-zinc-200: #E0E2E5;
  --color-zinc-300: #d4d4d8;
  --color-zinc-500: #959DA7;

  --color-background: #EBECEE;
  --color-card: #fafafa;
  --color-secondary: #fafafa;
  --color-muted: #fafafa;
  --color-border: #d4d4d8;
}

/* Clases aplicadas en componentes */
.bg-background {
  background-color: #EBECEE; /* ✅ Correcto - zinc-100 */
}

.bg-card {
  background-color: #fafafa; /* ✅ Correcto - zinc-50 */
}

.bg-secondary {
  background-color: #fafafa; /* ✅ Correcto - zinc-50 */
}

.border-border {
  border-color: #d4d4d8; /* ✅ Correcto - zinc-300 */
}
```

#### Dark Mode
```css
/* CSS Variables generadas */
:root {
  --color-zinc-800: #141E2C;
  --color-zinc-900: #02060C;
}

.dark {
  --color-background: #02060C;
  --color-card: #02060C;
  --color-secondary: #141E2C;
  --color-muted: #141E2C;
  --color-border: #141E2C;
}

/* Clases aplicadas en componentes */
.bg-card {
  background-color: #02060C; /* ✅ Correcto - zinc-900 */
}

.bg-secondary {
  background-color: #141E2C; /* ✅ Correcto - zinc-800 */
}
```

---

## ✅ Beneficios de Tokens Semánticos

1. **Sincronización automática:** Cambios en el design system se propagan automáticamente
2. **Intención clara:** `bg-card` es más descriptivo que `bg-zinc-900`
3. **Dark mode correcto:** Los valores se adaptan automáticamente
4. **Mantenibilidad:** Menos código, más consistente
5. **Escalabilidad:** Facilita temas personalizados

---

## 🛡️ Reglas de Implementación

### ✅ SIEMPRE usar tokens semánticos:
- `bg-card` - Contenedores principales
- `bg-secondary` - Elementos internos
- `bg-muted` - Fondos sutiles
- `bg-background` - Fondo de página
- `bg-primary` - Brand color (Volt Lime)
- `text-foreground` - Texto principal
- `border-border` - Bordes

### ❌ NUNCA usar tokens primitivos directamente:
- `bg-zinc-900` ❌
- `bg-zinc-800` ❌
- `bg-white dark:bg-zinc-900` ❌
- `text-zinc-900 dark:text-white` ❌

### ✅ Excepción: Cuando necesites valores específicos en ambos modos
```tsx
// Ejemplo: Hover sobre botón que invierte colores
className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
```

---

## 📚 Referencias

- **Strata Tokens (Light):** `Strata Design System/src/styles/tokens/variables.css`
- **Strata Tokens (Dark):** `Strata Design System/src/styles/tokens/variables-dark.css`
- **Tailwind Config:** `ds-selection/dealer/tailwind.config.js`
- **Design System Rules:** `DESIGN_SYSTEM_RULES.md`

---

## 🔄 Cambios Implementados

### 1. Corrección de Tokens Primitivos
**Archivo:** `Strata Design System/tokens/primitives/colors.json`

#### Dark Mode
- `zinc-800`: `#27272a` → `#141E2C` ✅
- `zinc-900`: `#18181b` → `#02060C` ✅

#### Light Mode
- `zinc-50`: `#fafafa` → `#fafafa` ✅ (ya correcto)
- `zinc-100`: `#f4f4f5` → `#EBECEE` ✅
- `zinc-200`: `#e4e4e7` → `#E0E2E5` ✅
- `zinc-500`: `#71717a` → `#959DA7` ✅

### 2. Actualización de Mapeos Semánticos (Dark Mode)
**Archivo:** `Strata Design System/tokens/semantic/colors-dark.json`
- `background`: `{color.mono.offBlack}` → `{color.zinc.900}` ✅
- `card`: `{color.mono.offBlack}` → `{color.zinc.900}` ✅
- `popover`: `{color.mono.offBlack}` → `{color.zinc.900}` ✅
- `secondary`: `{color.mono.deepGraphite}` → `{color.zinc.800}` ✅
- `muted`: `{color.mono.deepGraphite}` → `{color.zinc.800}` ✅
- `accent`: `{color.mono.deepGraphite}` → `{color.zinc.800}` ✅
- `border`: `{color.mono.deepGraphite}` → `{color.zinc.800}` ✅
- `input`: `{color.mono.deepGraphite}` → `{color.zinc.800}` ✅
- `sidebar`: `{color.mono.offBlack}` → `{color.zinc.900}` ✅
- `sidebar-accent`: `{color.mono.deepGraphite}` → `{color.zinc.800}` ✅
- `sidebar-border`: `{color.mono.deepGraphite}` → `{color.zinc.800}` ✅

### 3. Actualización de Mapeos Semánticos (Light Mode)
**Archivo:** `Strata Design System/tokens/semantic/colors.json`

#### Primera iteración:
- `background`: `{color.mono.offWhite}` → `{color.zinc.100}` ✅
- `card`: `{color.mono.offWhite}` → `{color.zinc.50}` ✅
- `popover`: `{color.mono.offWhite}` → `{color.zinc.50}` ✅
- `secondary`: `{color.zinc.100}` → `{color.zinc.200}`
- `muted`: `{color.zinc.100}` → `{color.zinc.200}`
- `border`: `{color.zinc.200}` → `{color.zinc.200}`

#### Ajuste final (elementos internos):
- `secondary`: `{color.zinc.200}` → `{color.zinc.50}` ✅
- `muted`: `{color.zinc.200}` → `{color.zinc.50}` ✅
- `accent`: `{color.zinc.200}` → `{color.zinc.50}` ✅
- `border`: `{color.zinc.200}` → `{color.zinc.300}` ✅
- `input`: `{color.zinc.200}` → `{color.zinc.300}` ✅
- `input-background`: `{color.zinc.200}` → `{color.zinc.50}` ✅
- `sidebar-accent`: `{color.zinc.200}` → `{color.zinc.50}` ✅
- `sidebar-border`: `{color.zinc.200}` → `{color.zinc.300}` ✅

### 4. Sincronización
- Ejecutado `npm run build:tokens` en Strata Design System (3 veces: dark mode, light mode, ajuste final)
- Ejecutado `npm run sync:tokens` en Dealer (3 veces)
- El servidor de desarrollo de Dealer detecta los cambios automáticamente (HMR)

---

## 🎨 Jerarquía Visual Final (Light Mode)

Después de pruebas visuales, se ajustó la jerarquía para mejorar la legibilidad:

```
Fondo de página (background)    → zinc-100 (#EBECEE)
  ↓
Contenedores grandes (card)     → zinc-50  (#fafafa)
  ↓
Elementos internos (secondary)  → zinc-50  (#fafafa) + borde zinc-300 (#d4d4d8)
```

**Razón del ajuste:** Usar zinc-200 para elementos internos generaba poco contraste. Al usar zinc-50 con bordes zinc-300, se mantiene una jerarquía visual clara sin sacrificar legibilidad.

---

---

## 🎯 Brand Color Strategy

### Adaptive Brand Color Implementation

El Strata Design System implementa una estrategia de color de marca **adaptativa** que cambia según el modo de luz/oscuridad para optimizar contraste y accesibilidad:

| Mode | Primary Action | Hex Value | Semantic Token | Usage |
|------|----------------|-----------|----------------|-------|
| **Light Mode** | `brand-300` | `#E6F993` | `primary` | Actions primarias en modo claro - máximo contraste con texto oscuro |
| **Dark Mode** | `brand-500` | `#C3E433` | `primary` | Actions primarias en modo oscuro - máxima visibilidad contra fondos oscuros |

### Razón de la Estrategia

**WCAG AAA Compliance:**
- Light mode: `brand-300` (#E6F993) + `text-zinc-900` (#02060C) = AAA contrast ratio ✅
- Dark mode: `brand-500` (#C3E433) + `bg-zinc-900` (#02060C) = AAA contrast ratio ✅

**Problema anterior:**
- Se usaba `brand-400` (#DAF75F) en modo oscuro, que tenía **menor contraste** que `brand-500`
- Documentación desactualizada mencionaba `brand-400` para modo oscuro ❌

### Implementación Correcta

```tsx
// ✅ CORRECTO - Usa token semántico que se adapta automáticamente
<Button variant="primary">Primary Action</Button>
// → Light: bg-brand-300 (#E6F993)
// → Dark: bg-brand-500 (#C3E433)

// ❌ INCORRECTO - Hardcodea brand-400
<Button className="bg-brand-400">Action</Button>
```

### CSS Variables Generadas

```css
/* Light Mode */
:root {
  --color-primary: #E6F993; /* brand-300 */
  --color-brand-300: #E6F993;
  --color-brand-400: #DAF75F; /* Solo para acentos sutiles */
  --color-brand-500: #C3E433;
}

/* Dark Mode */
.dark {
  --color-primary: #C3E433; /* brand-500 - CRÍTICO */
  --color-brand-300: #E6F993;
  --color-brand-400: #DAF75F;
  --color-brand-500: #C3E433;
}
```

---

## 🗑️ Eliminación de Palette "Mono" (Custom Colors)

### Problema Identificado

El Strata Design System tenía una palette personalizada `mono` con 4 colores que **no formaban parte del estándar**:

```json
"mono": {
  "offBlack": { "value": "#0B0B0C" },      // ❌ Eliminado
  "deepGraphite": { "value": "#1E1E22" },  // ❌ Eliminado
  "softGray": { "value": "#C8C8C8" },      // ❌ Eliminado
  "offWhite": { "value": "#F4F4F1" }       // ❌ Eliminado
}
```

### ¿Por qué se eliminaron?

1. **No están en la documentación visual oficial** (ColorsView.tsx)
2. **Crean tech debt** y confusión - ¿cuándo usar mono vs zinc?
3. **No siguen el sistema de paletas estándar** (50-950)
4. **Valores casi idénticos a zinc** - duplicación innecesaria

### Mapeo a Zinc (Reemplazo)

Todos los usos de `mono.*` fueron reemplazados por equivalentes en `zinc`:

| Mono (Eliminado) ❌ | Zinc (Reemplazo) ✅ | Valor | Uso |
|---------------------|---------------------|-------|-----|
| `mono.offBlack` | `zinc.900` | `#02060C` | Texto principal (light), fondos (dark) |
| `mono.deepGraphite` | `zinc.800` | `#141E2C` | Elementos secundarios (dark) |
| `mono.softGray` | `zinc.400` | `#B4BBC2` | Texto placeholder, disabled states |
| `mono.offWhite` | `zinc.100` | `#EBECEE` | Fondos (light), texto (dark) |

### Archivos Modificados

**Primitivos:**
- ✅ Eliminada la sección `mono` completa de `tokens/primitives/colors.json`

**Semánticos (Light Mode):**
```json
// Antes ❌
"foreground": { "value": "{color.mono.offBlack}" }

// Después ✅
"foreground": { "value": "{color.zinc.900}" }
```

**Semánticos (Dark Mode):**
```json
// Antes ❌
"foreground": { "value": "{color.mono.offWhite}" }

// Después ✅
"foreground": { "value": "{color.zinc.100}" }
```

---

## 📊 Historial Completo de Correcciones de Primitivos

### Brand Palette (Volt Lime) - 7 de 11 corregidos

| Shade | Valor Anterior ❌ | Valor Correcto ✅ | Estado | Fuente |
|-------|-------------------|-------------------|--------|--------|
| `brand-50` | `#fdfee7` | `#fdfee7` | Ya correcto | ColorsView.tsx |
| `brand-100` | `#faffc2` | `#F4F8E1` | **Corregido** | ColorsView.tsx |
| `brand-200` | `#f5ff92` | `#F4FFC9` | **Corregido** | ColorsView.tsx |
| `brand-300` | `#edff58` | `#E6F993` | **CRÍTICO - Corregido** | ColorsView.tsx (Primary Light) |
| `brand-400` | `#d6ff3c` | `#DAF75F` | **Corregido** | ColorsView.tsx |
| `brand-500` | `#b4eb00` | `#C3E433` | **CRÍTICO - Corregido** | ColorsView.tsx (Primary Dark) |
| `brand-600` | `#8bc200` | `#A0C114` | **Corregido** | ColorsView.tsx |
| `brand-700` | `#718B03` | `#718B03` | Ya correcto | ColorsView.tsx |
| `brand-800` | `#507206` | `#507206` | Ya correcto | ColorsView.tsx |
| `brand-900` | `#425e0b` | `#2A3400` | **Corregido** | ColorsView.tsx |
| `brand-950` | `#233502` | `#233502` | Ya correcto | ColorsView.tsx |

### Zinc Palette (Neutrals) - 4 de 11 corregidos

| Shade | Valor Anterior ❌ | Valor Correcto ✅ | Estado | Fuente |
|-------|-------------------|-------------------|--------|--------|
| `zinc-50` | `#fafafa` | `#fafafa` | Ya correcto | ColorsView.tsx |
| `zinc-100` | `#f4f4f5` | `#EBECEE` | **Corregido** | ColorsView.tsx |
| `zinc-200` | `#e4e4e7` | `#E0E2E5` | **Corregido** | ColorsView.tsx |
| `zinc-300` | `#d4d4d8` | `#D0D4D8` | **Corregido** | ColorsView.tsx |
| `zinc-400` | `#a1a1aa` | `#B4BBC2` | **Corregido** | ColorsView.tsx |
| `zinc-500` | `#71717a` | `#959DA7` | **Corregido** | ColorsView.tsx |
| `zinc-600` | `#52525b` | `#546070` | **Corregido** | ColorsView.tsx |
| `zinc-700` | `#3f3f46` | `#333F4E` | **Corregido** | ColorsView.tsx |
| `zinc-800` | `#27272a` | `#141E2C` | **Corregido** | ColorsView.tsx |
| `zinc-900` | `#18181b` | `#02060C` | **Corregido** | ColorsView.tsx |
| `zinc-950` | `#09090b` | `#09090b` | Ya correcto | ColorsView.tsx |

### Red, Amber, Indigo Palettes

Las palettes de **Red**, **Amber**, e **Indigo** ya tenían valores correctos que coincidían con la documentación visual en ColorsView.tsx:

- ✅ **Red (100-500):** Todos correctos
- ✅ **Amber (100-500):** Todos correctos
- ✅ **Indigo (100-500):** Todos correctos

**Nota:** Solo los shades 100-500 se muestran en la sección de Data Visualization de ColorsView.tsx. Los shades 50, 600-950 usan valores estándar de Tailwind.

---

## 📖 Source of Truth: ColorsView.tsx

### Establecimiento de la Fuente Canónica

**Archivo:** `Strata Design System/src/app/components/ColorsView.tsx`

Este archivo contiene la **galería visual de colores oficial** del Strata Design System y es la **única fuente de verdad** para todos los valores de color.

### ¿Por qué ColorsView.tsx?

1. **Visual y actualizado:** Muestra los colores tal como se ven en la aplicación
2. **Aprobado por diseño:** Es lo que los usuarios ven y aprueban visualmente
3. **Documentado:** Incluye descripciones de uso para cada shade
4. **Validable:** Los valores hex están hardcodeados y son verificables

### Proceso de Validación

```javascript
// scripts/color-reference.json - Extraído de ColorsView.tsx
{
  "brand": {
    "300": "#E6F993", // ← Valor canónico
    "500": "#C3E433"  // ← Valor canónico
  }
}

// Validación automática compara tokens.json con color-reference.json
// Si hay discrepancia → BUILD FAIL ❌
```

### Regla de Oro

**Si ColorsView.tsx y tokens.json no coinciden → ColorsView.tsx gana siempre.**

---

**Fecha:** 2026-02-12 (Actualizado: 2026-02-13)
**Autor:** Claude Code + Usuario
**Estado:** ✅ Implementado, sincronizado y verificado
**Versión:** 2.0 - Incluye brand colors, eliminación de mono, y correcciones completas
