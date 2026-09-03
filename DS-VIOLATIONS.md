# DS Violations · expert-hub

Defectos y desviaciones del Design System encontrados al mapear el código de producción para
reconstruirlo en Figma (ver `FIGMA_BUILD_SPEC.md`).

El archivo de Figma se está dibujando **como debería ser** — con tokens semánticos — así que este
documento es el delta entre lo que hay en el código y lo que el diseño va a mostrar.

Verificado contra `tailwind.config.js` (único config activo — el otro es `.bak`), `src/index.css` y
`src/styles/theme.css`.

---

## 🔴 1 · Clases que no existen y compilan a nada

**22 ocurrencias en 7 archivos.** `tailwind.config.js` declara únicamente
`border · input · ring · background · foreground · primary · secondary · destructive · muted ·
accent · popover · card · brand · zinc`.

**No existen `ai` ni `error`.** `index.css` solo define la animación `ai-glow`, ningún color.
Estas clases no generan CSS: el elemento queda sin color de fondo o hereda el de texto.

### Impacto visible

| Dónde | Qué se rompe |
|---|---|
| `components/Navbar.tsx:178` | Avatar de fallback del usuario: `bg-ai` + `text-white` → **fondo transparente con texto blanco = iniciales invisibles**. Solo se ve si falla la carga de la foto |
| `components/Navbar.tsx:205` | "Sign Out" con `text-error hover:bg-error-light` → **se ve en color de texto normal, no en rojo**. Pierde la señal de acción destructiva |
| `Transactions.tsx:1610, 1746, 2113, 2143` | Cuatro badges circulares "AI" con `bg-ai` + `text-white` → **círculo transparente, texto blanco invisible** |
| `OCRTracking.tsx:258-259` | Banner de procesamiento OCR: `bg-ai-light border-ai/20` + tile `bg-ai` → **sin fondo ni borde**, el icono blanco queda invisible |
| `OCRTracking.tsx:79` | Columna kanban "Needs Attention": `text-ai` → **label sin color de acento** |
| `components/ConvertDocumentModal.tsx` (8 usos) | Banner AI, tile de proceso, barra de progreso `bg-ai` → **barra de progreso invisible** |
| `components/AckReconciliationModal.tsx:422, 443-444` | Porcentaje de confianza y bloque de sugerencia AI sin color |
| `components/ResolveDiscrepancyModal.tsx:183` | Etiqueta de confianza AI sin color |
| `components/deprecated/types.ts:81` | `dark:bg-ai/15` en el badge de razón de deprecación |

### Fix

Los tokens correctos **sí existen** en `src/styles/tokens/variables.css`:
`--color-status-ai: #8b5cf6` y `--color-status-error: #C11736`.

Dos rutas:
- **A · Exponerlos en Tailwind** — agregar `status` al `theme.extend.colors` de `tailwind.config.js`
  con la misma forma `rgb(from var(--color-status-ai) r g b / <alpha-value>)`, y renombrar los usos a
  `text-status-ai` / `bg-status-ai/10` / `text-status-error`. Es lo alineado con el DS (que en v4 usa
  el prefijo `status-`).
- **B · Usar lo que ya está disponible** — `text-destructive` para el caso de "Sign Out", que ya
  resuelve. No cubre `ai`.

Recomendable **A**, porque deja el namespace `status-*` igual que en el Design System y que en el
archivo de Figma.

---

## 🟡 2 · Colores de estado en Tailwind crudo (LAW 1 y LAW 4)

**714 ocurrencias de escalas crudas en 58 archivos.**

⚠️ **No todas son violaciones.** Hay usos legítimos de primitivos: los gradientes de avatar en
`components/team/teamMembers.ts` son decorativos e intencionales, y `bg-brand-300/30` como fondo de
botón cumple LAW 2. La violación es **usar una escala cruda para comunicar estado**, donde existe un
token semántico.

Los archivos con más carga: `Transactions.tsx` (169), `AckReconciliationModal.tsx` (63),
`DocumentConversionModal.tsx` (52), `DiscrepancyList.tsx` (27), `Login.tsx` (22),
`FeedbackBoard.tsx` (19), `TrackingModal.tsx` (19), `OCRTracking.tsx` (16).

### Mapeo de remediación

| En el código hoy | Token correcto | Dónde aparece |
|---|---|---|
| `text-green-700 bg-green-50 ring-green-600/20` | `status-success` · `/10` · `/20` | Reviewed, Completed, Resolve |
| `text-red-700 bg-red-50` | `status-error` | Awaiting Expert, Discrepancy, Deprecate |
| `text-amber-700` / `text-amber-600` | `status-warning` | Pending, Pending For Review, severidad High |
| `bg-yellow-50 text-yellow-700` | `status-warning` | Pending For Review en la lista de OCR |
| `bg-blue-100 text-blue-800` / `text-blue-600` | `status-info` | Processing, Calculating…, Ingesting, severidad Medium |
| `bg-orange-50 text-orange-700` / `text-orange-600` | `status-warning` | In Progress, Mark Duplicate, Jira |
| `text-indigo-600` | `status-info` | columna In-progress del kanban |
| `bg-purple-50 text-purple-700` | `status-ai` | badge de razón de deprecación |

Ya correctos, no tocar: `bg-destructive/10 text-destructive` (severidad Critical),
`bg-muted text-muted-foreground` (severidad Low, contadores),
`bg-brand-300/30 border-brand-300/50` (botón "Compare with PO"),
`bg-zinc-700 text-white` del tab Deprecated (inversión intencional).

### Nota sobre LAW 5

El código también usa `dark:` explícito en todos estos casos
(`text-green-700 dark:text-green-300`), lo que LAW 5 prohíbe: los tokens semánticos ya cambian solos
entre modos. Migrar a `status-*` elimina la mitad de estas clases.

---

## 🟠 3 · Inconsistencias de diseño

### 3.1 · "In progress" tiene tres colores distintos

| Vista | Color |
|---|---|
| Lista de OCR Tracking (`OCRTracking.tsx:503`) | naranja — `bg-orange-50 text-orange-700` |
| Kanban de OCR Tracking (`OCRTracking.tsx:81`) | índigo — `text-indigo-600` |
| Transactions | otro |

El mismo estado del mismo documento se ve de tres colores según dónde lo mires.
**Propuesta: `status-info` en los tres.**

### 3.2 · El pill de estado no tiene forma consistente

| Dónde | Forma |
|---|---|
| `OCRTracking.tsx` | `rounded-md px-2.5 py-1 text-xs` |
| `Comparisons.tsx` | `rounded-full px-2 py-0.5 text-[10px]` (grid) y `text-xs` (lista) |
| `ResolutionPill.tsx` | `rounded-full px-2.5 py-1 text-[11px]` |

**Propuesta:** una sola forma, alineada con la de `ResolutionPill` que ya está bien resuelta —
`rounded-full px-2 py-0.5 text-xs font-semibold`. El componente `StatusPill` de Figma la fija.

### 3.3 · Dos librerías de iconos conviviendo

Expert Hub importa **88 iconos únicos de `lucide-react`** y **69 de `@heroicons/react`** — 157 en
total, de dos familias visuales distintas, en el mismo producto.

`Transactions.tsx` es el caso más visible: es la única pantalla que usa Heroicons, mientras las
otras tres usan lucide. `UI-Dealer` ya completó la migración (0 heroicons en 116 archivos), así que
expert-hub es el que quedó atrás.

Consecuencia: dos gramáticas de icono (Heroicons es más redondeado y de trazo variable; lucide es
de trazo uniforme 2px) en pantallas contiguas.

**En Figma se construyen ambos sets** para que el espejo sea fiel al estado actual, pero queda
registrado como deuda: la dirección del sistema es lucide.

### 3.4 · Filtro placeholder

El pill `All` del toolbar de OCR Tracking (`OCRTracking.tsx:339-345`) está marcado en el código como
*"Filter documents (placeholder)"* y no hace nada. Decidir si se especifica de verdad o se elimina
del diseño.

---

## Prioridad sugerida

1. **§1** — son bugs reales con impacto visible, y el fix es acotado (22 usos, un cambio de config).
2. **§3.1 y §3.2** — inconsistencias que confunden al usuario y que el diseño nuevo ya unifica.
3. **§2** — el volumen es grande (714 usos) pero es deuda cosmética, no funcional. Conviene atacarla
   por archivo, empezando por `Transactions.tsx`, y apoyándose en el `semanticReplacements` de
   `ds-component-map` (`data/laws.json`) y su transformador `src/lib/transform-snippet.ts`, que ya
   genera parches aplicables con `git apply`.
