# Figma Build Spec · Expert Hub → Strata Dealer Experience

Mapa de **estructura → navegación → secciones → componentes y variantes**, derivado del código de
producción (no del Figma viejo, que está 5 meses atrasado).

Es el documento de ejecución de las Fases 2 y 3 del plan. Todo se diseña en **modo claro**.

**Fuente:** `src/App.tsx`, `src/components/Navbar.tsx`, `src/OCRTracking.tsx`, `src/Comparisons.tsx`,
`src/Transactions.tsx`, `src/FeedbackBoard.tsx`, `src/Login.tsx`, `src/components/create-record/**`,
`tailwind.config.js`, `src/styles/theme.css`.

---

## 0 · Estructura global

**No hay router.** `App.tsx` es un `useState<Page>` con 4 valores:
`'ocr-tracking' | 'feedback' | 'transactions' | 'comparisons'`, default **`ocr-tracking`**.

Tres estados de aplicación antes de llegar a cualquier pantalla:

| Estado | Render |
|---|---|
| `initialLoading` | spinner centrado — `h-8 w-8 border-b-2 border-primary` sobre `bg-background` |
| `!user` | `<Login />` a pantalla completa |
| autenticado | shell + pantalla activa + `SessionExpiryModal` global |

⚠️ **Asimetría a respetar:** `Transactions` es la única pantalla donde `App.tsx` renderiza el
`<Navbar>` por fuera; las otras tres lo montan internamente. En Figma no cambia nada visual, pero
explica por qué el markup difiere.

### Chrome compartido por las 4 pantallas

```
<div class="min-h-screen bg-background font-sans text-foreground pb-10">
  ├─ Breadcrumbs        fixed top-2 left-6 z-50 text-xs opacity-80
  ├─ Navbar             fixed top-6 left-1/2 -translate-x-1/2 z-50
  └─ <div class="pt-24 px-4 max-w-screen-2xl mx-auto space-y-6">
       └─ Card principal   bg-card rounded-2xl border border-border shadow-sm overflow-hidden
            ├─ Header      p-6 border-b border-border
            └─ Body        p-6
```

El breadcrumb va **por encima** del navbar (arriba-izquierda), no dentro de la card.
Patrón: `Expert Hub → <Sección>`. Etiquetas exactas: `OCR Tracking`, `Comparisons`, `Feedback Board`.

**Frame maestro para Figma:** `Page / Shell` con slots para Breadcrumb, Navbar, Header y Body.
Ancho de trabajo sugerido **1600 px** (`max-w-screen-2xl` = 1536 + padding).

---

## 1 · Navegación — `Navbar`

Pill flotante. `min-w-[60vw] lg:w-[80vw] max-w-7xl`, `rounded-full`, `px-3 py-2`,
`bg-card/80 backdrop-blur-xl border border-border shadow-lg`.

### Zona izquierda
- Logo `h-8 w-20` (dos PNG, se intercambian por tema — en claro va `logo-light-brand.png`).
- Divisor vertical `w-px h-6 bg-border`.
- **Tenant switcher**: eyebrow `TENANT` (`text-[10px] uppercase tracking-wider text-muted-foreground`)
  sobre el valor en `text-sm font-bold` + chevron que rota 180° al abrir.
  Label colapsa a `"N Tenants"` cuando hay más de uno seleccionado.
  - Dropdown `w-64 bg-card border border-border rounded-xl shadow-lg p-1`, con cabecera
    `Tenants` + link `Select All`, y filas de checkbox cuadrado (`h-4 w-4 rounded`,
    activo `bg-primary border-primary` con check en `primary-foreground`) + icono `Building2` + nombre.
  - Tenants: `SPECIAL T · Meridian Office · Strata · Apex Interiors · ClearSpace Design`.

### Zona central — 4 tabs
`h-9 px-3 rounded-full`. El label **está oculto y se expande** en hover o cuando está activo
(`max-w-0 opacity-0` → `max-w-xs opacity-100`, 300 ms).

| Tab | Icono (lucide) | Página |
|---|---|---|
| OCR Tracking | `ScanEye` | `ocr-tracking` |
| Transactions | `Receipt` | `transactions` |
| Comparisons | `GitCompare` | `comparisons` |
| Feedback | `MessageSquare` | `feedback` |

Activo: `bg-primary text-primary-foreground`. Inactivo: `text-muted-foreground`, hover a `foreground`.

### Zona derecha
Bell (`h-9 w-9 rounded-full`, sin funcionalidad) · toggle de tema (Sun/Moon) · divisor ·
**user chip**: avatar `w-8 h-8 rounded-full border-2 border-border` (fallback con iniciales sobre
`bg-ai`), nombre `text-xs font-semibold` + rol `text-[10px]` (`Expert`), chevron.
Menú `w-48`: cabecera con nombre + email, `Change Password` (`KeyRound`), `Sign Out` (en rojo).

### Variantes Figma de `Navbar`
`activeTab` = OCR · Transactions · Comparisons · Feedback (4) ×
`tenantOpen` = false·true × `userMenuOpen` = false·true.
Recomendación: **una variante por `activeTab`** + los dos dropdowns como componentes sueltos
(`Navbar / TenantDropdown`, `Navbar / UserMenu`) para no explotar la matriz.

---

## 2 · Sección `OCR Tracking` (default)

### Header — fila 1
Título `OCR Tracking` (`text-lg font-semibold`) + **funnel de tabs** en
`bg-muted p-1 rounded-lg`, cada tab con contador y tooltip:

| id | Label | Tooltip |
|---|---|---|
| `all` | All | All documents currently in the OCR pipeline |
| `identified` | Ingesting | Newly uploaded documents being scanned and classified |
| `capturing` | Needs Attention | Fields extracted with low confidence — manual review suggested |
| `inconsistencies` | Awaiting Expert | Inconsistencies detected — needs Expert Hub resolution |
| `in_progress` | In-progress | An Expert Hub member is actively resolving inconsistencies |
| `processed` | Reviewed | Reviewed by an expert · ready to create as Orderbahn records |
| `completed` | Completed | Documents fully processed and turned into Orderbahn records |
| — | *divisor `w-px h-5 bg-border`* | |
| `deprecated` | **Deprecated** | Archived documents — no longer in the active pipeline |

Tab activo `bg-primary text-primary-foreground shadow-sm`; contador activo
`bg-primary-foreground/10`, inactivo `bg-background`.
**`Deprecated` usa un estilo invertido aparte**: activo `bg-zinc-700 text-white`
(en Figma: `foreground` / `background` invertidos, no `primary`).

### Header — fila 2 (toolbar)
`Search documents...` (input `pl-9` con icono) · pill de filtro (`All` + chevron, placeholder no
funcional) · **avatar group** (`-space-x-2`, 6 miembros `h-8 w-8` con `ring-2 ring-card` + chip `+N`) ·
`ml-auto` → view toggle (List/Board, par de iconos unidos en `border rounded-lg overflow-hidden`) ·
CTA **`Upload Document`** (`bg-primary text-primary-foreground rounded-lg`, icono `Upload`).

### Banner de procesamiento (condicional)
`bg-ai-light border-ai/20 rounded-xl p-4 animate-pulse` · tile `w-8 h-8 rounded-lg bg-ai` con
`ScanEye` girando · "Processing document..." / "OCR extraction in progress — extracting fields and
validating data". **⚠️ `bg-ai` / `bg-ai-light` no existen** (ver §7).

### Vista Kanban (default)
Scroll horizontal, columnas `min-w-[300px]`. Cabecera = label coloreado + contador
(`bg-muted rounded-md`) + `MoreHorizontal`.

| Columna | Icono | Color del label |
|---|---|---|
| Ingesting | `FileText` | `text-blue-600` |
| Needs Attention | `ScanEye` | `text-ai` ⚠️ |
| Awaiting Expert | `AlertTriangle` | `text-amber-600` |
| In-progress | `Loader2` | `text-indigo-600` |
| Reviewed | `CheckCircle2` | `text-green-600` |
| Completed | `CheckCircle2` | `text-green-600` |

Empty state por columna: `border-2 border-dashed border-border rounded-xl p-6` + "No documents".

### Vista List
Columnas: `Document · Vendor · Status · Review Status · Date · Actions`.
Header `text-[10px] font-bold uppercase tracking-wider text-muted-foreground` sobre `bg-muted/30`.

- **Document**: `FileText` + id en `font-mono font-bold` + `N line items` en `text-[11px]`.
- **Vendor**: nombre en negrita + `DocTypeChip` debajo.
- **Status** (`rounded-md px-2.5 py-1 text-xs font-semibold`): `Reviewed` (verde) ·
  `In Progress` (naranja) · `Awaiting Expert` (rojo) · `Processing` (azul).
- **Review Status**: `Reviewed` (verde, `CheckCircle2`) · `Calculating…` (azul, `Loader2` girando) ·
  `Pending For Review` (amarillo, `AlertTriangle`).
- **Actions**: Review Fields (`FileText`) · Preflight Sync (`Send`, solo en `processed`) ·
  Mark Completed (`CheckSquare`, con **variante deshabilitada** "Mark as Reviewed first") ·
  Deprecate (`Trash2`, rojo) · avatar del asignado.

### Barra flotante de multi-selección
`fixed bottom-6 left-1/2 · bg-card border rounded-2xl shadow-2xl px-4 py-3` ·
badge circular con el conteo (`bg-primary`) + "N documents selected" + divisor +
CTA "Send feedback for N" + link "Clear".

### Modales montados
`DocumentReviewModal` · `FeedbackComposerModal` · `DocumentDeprecationModal` ·
`CreateRecordModal` · `ComparisonLauncher` · `PreflightSyncModal` · `UploadDocumentModal` ·
`ToastContainer`.

---

## 3 · Sección `Comparisons`

Funnel: `All · Pending · Reviewed · Discrepancy · Completed` (con contadores).
Toolbar: `Search comparisons…` + view toggle **List / Grid** (aquí Grid es el default, al revés que OCR).

### Card de la grilla (`grid sm:2 lg:3 2xl:4 gap-4`)
`bg-card border border-border rounded-2xl shadow-sm hover:shadow-md`, padding `p-4`:
1. Tile `h-9 w-9 rounded-lg bg-muted` con `FileText` + vendor en negrita + `DocTypeChip
   type="Acknowledgment" size="sm"` + id en `font-mono text-[11px]`; a la derecha avatar de
   iniciales `h-7 w-7` con gradiente.
2. Dos filas clave/valor: `Linked PO` (valor en `font-mono`) y `Line Items`.
3. Botón ancho completo **`Compare with PO`** —
   `bg-brand-300/30 border border-brand-300/50 text-foreground`, `text-xs font-bold`.
   *(uso legítimo de brand como fondo, cumple LAW 2)*
4. Footer separado por `border-t`: pill de estado + acciones
   (`FileSearch` reconciliar; `AlertTriangle` ámbar **solo si `status === 'Discrepancy'`**).

### Vista List
`Document · Vendor · Linked PO · Status · Review Status · Date · Actions`.
En Actions el botón `Compare` aparece con label, no solo icono.

### Vocabularios
`CompareStatus`: `Pending` (ámbar) · `Reviewed` (verde) · `Discrepancy` (rojo) · `Completed` (verde).
`reviewStatus`: `Reviewed` · `Pending For Review`.

### Empty state
Tile `h-14 w-14 rounded-2xl bg-muted` con `GitCompare` + "No comparisons" +
"Acknowledgments paired with a purchase order appear here for review."

---

## 4 · Sección `Transactions` (la más grande — 3181 líneas)

Única pantalla con **Heroicons** en vez de lucide, y con **recharts**.

- **Segmented de ciclo de vida**: `Purchase Orders` / `Acknowledgements`
  (activo `bg-card text-foreground shadow-sm`). Existe un tercer valor `quotes` en el modelo de
  datos pero la feature se movió al repo `expert-catalog`.
- **Tabs de estado**: `Active | Completed | All`.
- **View toggle**: List (`ListBulletIcon`) / **Pipeline** (`FunnelIcon`).

### KPIs — ⚠️ están gateados con `{false && …}` ("hidden during demo")
**Se diseñan igual**, porque son la superficie que vuelve. Dos formas:

1. **Grid expandido** — `grid sm:2 lg:4 xl:5`, cards `rounded-2xl p-6`: eyebrow en mayúsculas +
   valor `text-3xl` + tile de icono coloreado + subtexto + trend `↑/↓`.
2. **Ticker colapsado** — tira con scroll horizontal y chevrons a los lados; por métrica:
   icono redondo + valor + trend + label, separados por divisores. Debajo, fila compacta de
   quick actions: `New Order · New Quote · Export PDF · Export SIF`.

Los sets de KPI cambian por ciclo de vida **y** por escala de tenant (4 tramos):

| Ciclo | Métricas |
|---|---|
| Orders | Active POs · Pending Approval · In Production · Ready to Ship · Total Value |
| Acks | Pending Acks · Inconsistencies · Reconciled · Avg Lead Time · On Time Rate |
| Quotes | Open Quotes · Negotiating · Approved · Win Rate · Pipeline Val |

→ Variantes de `KpiCard`: `color` ∈ blue·orange·purple·indigo·green·red × `trendUp` ∈ true·false.

### Tabla — columnas contextuales
| Posición | Orders | Acknowledgements |
|---|---|---|
| 1 | Details | Vendor |
| 2 | Project & Location | PO & Location |
| 3 | Amount | **Inconsistency** (rojo si ≠ `None`) |
| 4 | Status | Status |
| 5 | Date | Date |
| 6 | Actions | Actions |

### Pipeline (kanban)
- Orders: `Received · Pending Review · In Review · Approved`
- Acks: `Received · Pending Review · Discrepancy · Approved`
- Quotes: `Draft · Sent · Negotiating · Approved · Lost`

Las tarjetas del pipeline traen `DocTypeChip`, y en acks muestran `Exp. Ship` + `PO #` en vez de
`Amount` + `Project`.

### Charts
`BarChart` + `LineChart` de recharts usando los tokens `--chart-*`. Título dinámico:
`Sales` / `Pipeline` / `Acknowledgements` — `{periodo}`, con `Select` de periodo.

---

## 5 · Sección `Feedback Board`

Funnel de **9 tabs con badge dual** (rojo = no leídos, gris = total):
`All · In Jira · Submitted · Triaged · Assigned · Resolved · Closed · Dropped · Duplicated`.

Tabla: `Description · Category · Severity · State · Assigned To · Submitted By · Date · Jira · Actions`.

### Vocabularios
- `Severity`: `Critical` (`bg-destructive/10 text-destructive`) · `High` (ámbar) · `Medium` (azul) ·
  `Low` (`bg-muted text-muted-foreground`)
- `FeedbackState`: `Submitted · Triaged · Assigned · Resolved · Closed · Dropped · Duplicated`
- `Category`: `Bug · Feature Request · UI/UX · Data · Performance`

### Quick actions por estado (iconos con tooltip literal)
| Estado | Acciones |
|---|---|
| Submitted | Triage (`Filter`, azul) · Drop (`Trash2`, destructive) · Mark Duplicate (`Copy`, naranja) |
| Triaged | Assign (`UserPlus`) · Resolve (`Check`, verde) · Drop · Mark Duplicate |
| Assigned | Resolve · Close (`XCircle`, muted) · **Promote to Jira** / `Open Jira` (`ExternalLink`, naranja) |
| Terminal | Reopen (`RotateCcw`) |

Extras: agrupación de duplicados con contador **"Me too"**, adjuntos (PDF/PNG + KB), fechas
relativas. Todo el estado persiste en `localStorage` (`expert-hub.feedback.*`).

Empty state: tile con `Inbox` + "No feedback yet" / "When users submit feedback, rows will appear
here live."

---

## 6 · Inventario por sección → componente Figma

| Componente | Secciones donde aparece | Propiedades de variante |
|---|---|---|
| `Page / Shell` | las 4 | — (slots) |
| `Navbar` | las 4 | `activeTab` (4) |
| `Breadcrumbs` | las 4 | `depth` 2 |
| `FunnelTabs` | las 4 | `count` 5·7·9 · `badge` single·dual · `hasArchiveTab` bool |
| `Toolbar` | las 4 | `hasFilter` · `hasAvatars` · `hasCta` |
| `ViewToggle` | OCR · Comparisons · Transactions | `options` list/board · list/grid · list/pipeline |
| `SearchInput` | las 4 | `state` default·focus·filled |
| `DataListTable` | las 4 | `columns` 6·7·9 · `Row` default·hover |
| `KpiCard` | Transactions | `color` (6) × `trendUp` (2) |
| `KpiTicker` | Transactions | `scrollable` bool |
| `OcrDocCard` | OCR (kanban) | `selected` · `hasCompareLink` · `status` (6) |
| `ComparisonCard` | Comparisons (grid) | `status` (4) · `hasDiscrepancyAction` |
| `KanbanColumn` | OCR · Transactions | `empty` bool · `accent` (5 colores) |
| `StatusPill` | las 4 | `tone` success·warning·error·info·ai·neutral × `size` sm·md × `icon` bool |
| `DocTypeChip` | OCR · Comparisons · Transactions | `type` PO·ACK·Quote·Invoice × `size` sm·md |
| `SeverityBadge` | Feedback | `level` critical·high·medium·low |
| `AvatarStack` | OCR | `count` 1–6 + `overflow` bool |
| `Avatar` | todas | `size` 7·8 · `type` image·initials |
| `EmptyState` | Comparisons · Feedback · OCR | `variant` card·dashed |
| `FloatingSelectionBar` | OCR | — |
| `Banner` | OCR | `tone` ai·info·warning·error·success |
| `Toast` | las 4 | `type` success·error·info + `hasAction` |
| `IconButton` | las 4 | `tone` neutral·success·error·warning × `state` default·hover·disabled |
| `Button` | las 4 | `variant`·`size`·`shape` (ver plan Fase 2) |

Más el bloque completo de **preflight / create-record** (§C del plan), que no aparece en ninguna
pantalla de lista sino dentro de `CreateRecordModal`.

---

## 7 · ⚠️ Normalización de color — el trabajo real de esta migración

**Las pantallas NO usan los tokens de estado.** Usan clases Tailwind crudas, lo que viola LAW 1 y
LAW 5. En Figma se diseña con el token que el color **significa**, y esta tabla queda como el spec
de remediación para los devs.

| En el código hoy | Token en Figma | Dónde |
|---|---|---|
| `text-green-700 bg-green-50 ring-green-600/20` | `status-success` · `status-success/10` · `/20` | Reviewed, Completed, Resolve |
| `text-red-700 bg-red-50` | `status-error` | Awaiting Expert, Discrepancy, Deprecate |
| `text-amber-700 bg-amber-50` / `text-amber-600` | `status-warning` | Pending, Pending For Review, High |
| `bg-blue-100 text-blue-800` / `text-blue-600` | `status-info` | Processing, Calculating…, Ingesting, Medium |
| `bg-yellow-50 text-yellow-700` | `status-warning` | Pending For Review (lista OCR) |
| `bg-orange-50 text-orange-700` / `text-orange-600` | `status-warning` | In Progress, Mark Duplicate, Jira |
| `text-indigo-600` | `status-info` | columna In-progress del kanban |
| `text-ai` · `bg-ai` · `bg-ai-light` · `border-ai/20` | `status-ai` | Needs Attention, banner OCR, avatar fallback |
| `text-error` · `bg-error-light` | `status-error` | Sign Out del menú de usuario |
| `bg-destructive/10 text-destructive` | ✅ ya correcto | Severity Critical |
| `bg-muted text-muted-foreground` | ✅ ya correcto | Severity Low, contadores |
| `bg-brand-300/30 border-brand-300/50` | ✅ correcto (brand como fondo) | Compare with PO |
| `bg-zinc-700 text-white` | inversión intencional → `foreground`/`background` | tab Deprecated |

### 🐛 Hallazgos que hay que decidir antes de diseñar

1. **`text-ai`, `bg-ai`, `bg-ai-light`, `text-error`, `bg-error-light` no existen.**
   Verificado contra `tailwind.config.js`: solo declara `border · input · ring · background ·
   foreground · primary · secondary · destructive · muted · accent · popover · card · brand · zinc`.
   No hay `ai` ni `error`. **22 ocurrencias en 7 archivos** compilan a nada:
   - El avatar de fallback del Navbar queda **transparente** con texto blanco → invisible.
   - "Sign Out" se ve en color de texto normal, no en rojo.
   - El banner de procesamiento OCR y la columna "Needs Attention" pierden el acento morado de AI.

   → En Figma se diseña **como debería ser** (`status-ai`, `status-error`) y se abre el fix en código.

2. **"In progress" tiene tres colores distintos** según la vista: naranja en la lista de OCR,
   índigo en el kanban de OCR, y otro en Transactions. Hay que unificar — propuesta: `status-info`.

3. **El pill de estado no tiene forma consistente**: `rounded-md` en OCR, `rounded-full` en
   Comparisons, tamaños `text-[10px]` / `text-xs` mezclados. El componente `StatusPill` de Figma
   debe fijar **una** forma; propuesta `rounded-full px-2 py-0.5 text-xs font-semibold`, alineada
   con la que ya usa `ResolutionPill`.

4. **`Deprecated` no está en `COLUMNS`** pero sí es un tab. En kanban nunca se muestra: el tab
   reemplaza el body entero por `DeprecatedGrid`. No hay que diseñar columna para él.

5. **El filtro `All` de OCR es un placeholder sin funcionalidad** (comentado en el código).
   Decidir si en el diseño nuevo se especifica de verdad o se elimina.

---

## 8 · Orden de construcción sugerido

1. `Page / Shell` + `Navbar` + `Breadcrumbs` → desbloquea las 4 pantallas.
2. `FunnelTabs` + `Toolbar` + `SearchInput` + `ViewToggle` → desbloquea todos los headers.
3. `StatusPill` + `DocTypeChip` + `Avatar`/`AvatarStack` → los átomos más repetidos.
4. `DataListTable` → 4 pantallas de una.
5. Pantallas 2 → 3 → 5 (OCR, Comparisons, Feedback), que comparten casi todo.
6. `Transactions` al final: es la que más superficie propia tiene (KPIs, pipeline, charts).
7. `CreateRecordModal` y el bloque preflight como track paralelo — no depende de las listas.
