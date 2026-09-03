# time-tracker

Demo standalone de time tracking + dashboards para creative/design teams · **inspirado en el cliente Wurkwel** (3 sister companies · 10 designers · Design Manager McKinley Miller · Leadership Jimmy Friel Jr.) pero neutral en branding para reusarse en pitches similares.

**Base**: clon físico de [`ack-vs-po-demo@f9f83e1`](../ack-vs-po-demo/) · 2026-09-03 · versión más reciente de `expert-hub` en el ecosistema Strata (incluye OCR + Comparisons + Feedback surfaces heredadas).

**Feature nuevo del proyecto**: `Time Tracker` tab · dos surfaces role-aware:
- **My Timesheet** (designer default) · weekly grid + entry form + deliverable checkbox + cumulative hours + rules-based project filter
- **Team View** (manager default) · utilization heatmap + missing-time digest + outlier coaching cards + training-gap sparklines + drill-down

## Base research + design blueprint

Todo el diseño está fundamentado en un benchmark competitivo (Harvest · Toggl · Timely · Clockify · Hubstaff) contra los 7 pains rankeados del cliente:
- **MD report**: [`strata-docs/02-demo-projects/wurkwel/wurkwel-benchmark-2026-09-03.md`](../../../strata-docs/02-demo-projects/wurkwel/wurkwel-benchmark-2026-09-03.md)
- **Value hypothesis**: [`strata-docs/02-demo-projects/wurkwel/wurkwel-value-hypothesis.md`](../../../strata-docs/02-demo-projects/wurkwel/wurkwel-value-hypothesis.md)
- **Artifact visual**: https://claude.ai/code/artifact/88d19761-1ce5-42d1-86c5-429b29bdd047

## 3 whitespaces confirmados (differentiators)

Features que NINGÚN competitor tiene native · headline del demo:

1. **Deliverable checkbox → email al sales rep** (pain #3 · sev 4). First-class object en la entry, 5s undo toast antes de fire webhook/email.
2. **In-form cumulative project hours** (pain #7 · sev 2). "Project total after save: 48h / 60h budget" inline, no en un dashboard separado.
3. **Training-gap sparklines per designer × task-type** (adjacent pain). Trend sin verdict — manager infiere.

## Adaptaciones `TT.*` (trazabilidad)

Todas las adaptaciones del template llevan comentario prefijo `TT.*` (Time Tracker):

| ID | Adaptación | Archivo |
|---|---|---|
| TT.0 | Rename package + port 8090 + provenance + title HTML "Time Tracker" | `package.json` · `vite.config.ts` · `README.md` · `CLAUDE.md` · `index.html` |
| TT.1 | Surface A · Designer Time Entry · Navbar tab "Time Tracker" (icon Clock, primer pill de contenido) · App.tsx route `time-tracker` (default landing) · `TimeTracker.tsx` root + segmented control (My Timesheet / Team View) + week nav · `WeeklyGrid.tsx` (Toggl-style day rows + entry chips + today ring + billable/internal totals + capacity %) · `TimeEntryForm.tsx` (modal · duration + project + task type + memo + cumulative hours inline + deliverable checkbox · Cmd+Enter save + Esc close · prompt-before-save si Task Type vacío · save-state indicator) · `ProjectSelector.tsx` (rules-based auto-hide + Include archived toggle) · `TaskTypeDropdown.tsx` (admin-owned taxonomy + completion states v1/v2/v3/complete) · `CumulativeHoursInline.tsx` (whitespace #2 · Project total after save X/Y budget · slim progress bar + severity colors) · `DeliverableCompleteCheckbox.tsx` (whitespace #1 · 5s undo window + mock webhook to sales rep) · mock data (10 designers × 4 weeks · outlier sarah 5.5h · training-gap marcus+priya on block-plan · deliverable jennifer last week) · `coachingCopy.ts` copy library locked | `src/App.tsx` · `src/components/Navbar.tsx` · `src/TimeTracker.tsx` (new) · `src/components/timetracker/*` (6 nuevos) · `src/data/{coachingCopy,taskTypes,projects,timeEntries}.ts` (4 nuevos) |
| TT.2 | WeeklyGrid rewrite · Google Calendar-style week view (time axis vertical 7am-7pm · 15-min slots · 7 day cols · absolutely-positioned entry blocks · today col ring + current-time red line · weekend `opacity-60` · overlap side-by-side · sticky day headers con totales) · **drag-to-create** (drag on empty area → ghost block → release → form pre-filled with date + duration + start time) · **drag-to-move** (drag entry a otro slot/día · snap 15min · toast confirmando "Moved to · Undo") · **drag-to-resize** (drag bottom edge · min 15min · toast confirmando duration change) · custom Pointer Events API handlers (no external DnD lib) · deliverable-complete ✓ overlay top-right · `TimeEntry.startMinutesFromMidnight?` field opcional + auto-stack fallback · generator asigna start times realisticas (8am chain + break 5-15min · meetings snap round hour · skip lunch) · `TimeEntryForm.tsx` prop `initialDurationMinutes/initialStartMinutes` para drag-create pre-fill | `src/components/timetracker/WeeklyGrid.tsx` (rewrite completo) · `src/data/timeEntries.ts` (field + generator + calendar constants) · `src/components/timetracker/TimeEntryForm.tsx` (props opcionales) · `src/TimeTracker.tsx` (handlers move/resize + formatDayShort/formatTime) |
| TT.3 | EntryBlock refinement · iconografía por task-type (Lucide Boxes/Palette/Presentation/Users/Wrench/Sun/Coffee) para reconocibilidad aún con width comprimido · **adaptive layout** por (a) colCount overlaps y (b) height del block: SHORT <44px = single-row icon+label+hours · MEDIUM 44-72px = icon+label + time/project · FULL ≥72px = todo + memo si height>90px · **project color rail** (deterministic HSL hash del project.id) 3px izquierda para diferenciación cross-project · **hover-focus**: block gana `z-40` + `shadow-lg` para ver completo cuando overlap · **rich tooltip** con label · project · time range · memo · billable/internal via `title` attr · resize handle opacity-0 default (reveal on hover) para menos clutter visual · reducido padding en compact (`pl-2 pr-1.5 py-0.5-1.5`) | `src/components/timetracker/WeeklyGrid.tsx` (icon map + hue helper + EntryBlock rewrite) |
| TT.4 | Fix bug del generator · antes hacía "wrap" a 8am si un entry rebasaba las 6pm · eso creaba overlap directo con el 1er entry del día (que también arranca en 8am · ambos aparecían side-by-side en la misma franja 8:00-9:30 AM sin querer). Cambio a `break` del loop: si el entry no cabe antes de 6pm, no se agrega. Zero overlaps accidentales · los únicos side-by-splits ahora son intencionales (sarah outlier 9-2:30pm spans lunch por diseño) | `src/data/timeEntries.ts` |
| TT.5 | 6 edge cases ahora cubiertos tras revisar docs Wurkwel: (a) **Parallel work** overlaps permitidos (spirit "no limits enforced" del cliente) con warning sutil ring-warning + micro-badge "⚠N" top-left + tooltip "Overlaps with N other entr(y/ies)" · (b) **Off-hours toggle** "Extended hours" (5am-11pm) vs default (7am-7pm) · doc lit permite cualquier hora (`sot.md:67`) · botón en toolbar del grid · (c) **Holiday/PTO/Sick auto-fill 8h** al seleccionar en dropdown · doc lit *"Holidays se loguean como 8h internal"* (`sot.md:90`) · McKinley: *"no quiero que tengan que log-on just to log holiday hours"* · aplicado solo en new entries · (d) **Copy previous week** button (Harvest pattern) en toolbar · duplica entries no-time-off del week anterior al mismo weekday+start+duration · confirm dialog si el week ya tiene entries · (e) **Summer Fridays -4h** toggle · resta 4h del capacity target (36h vs 40h) · doc lit `sot.md:61` · McKinley cita transcript · state en TimeTracker · (f) 2 mock entries off-hours (6:30am early call + 7:30pm evening render) para probar toggle Extended | `src/data/timeEntries.ts` (constants + mocks) · `src/components/timetracker/WeeklyGrid.tsx` (toolbar + toggles + isOverlapping + dayStartMin dynamic + auto-scroll on toggle) · `src/components/timetracker/TimeEntryForm.tsx` (auto-fill 8h for time-off) · `src/TimeTracker.tsx` (summerFridays state + copy-previous-week handler + dayDelta helper) |
| TT.6 | **Surface B · Manager Dashboard (Fase 5 del plan)** · `TeamView.tsx` root que compone: **AttentionNeededCard** (hero card top-left · priorities missing-time > outlier > training-gap > parallel-work · click drills-down) · **MissingTimeDigest** (Clockify batched pattern · Friday 12pm alert card con lista + button "Send friendly nudge" + preview dialog con confirm-before-dispatch H5) · **UtilizationHeatmap** (Toggl-style day × designer grid · thresholds green ≥80% / amber 70-79% / red <70% / purple >110% overwork · nodata muted · row-click abre drilldown · today col ring · weekend opacity-60 · billable/internal split week total) · **OutlierCoachingCard** (3-tier severity amber ≥4h / red ≥6h · copy tone COACHING via coachingCopy.ts · "Kate logged 5.5h · worth a check-in?" NEVER "flagged" · botón MessageCircle envía check-in mock) · **TrainingGapSparklines** (whitespace #3 · SVG inline sparklines por designer × task-type · 4-week window · trend % + team avg overlay dashed · fastestPeer hint en copy · minAbsTrend 15% para filtrar noise) · **DesignerDrilldown** (Headless UI Dialog · totals stripe billable/internal/total/capacity% · filter chips project + task-type · CSV export completo con headers + escape · entries grouped by day) · toda la lógica de detección en `src/data/managerInsights.ts` (7 selectors + helpers) · TimeTracker wired con `onSendDigest` + `onSendCoachingMessage` toasts · TeamViewPlaceholder removido · **parallel-work signal ahora shipped** en AttentionNeededCard (postergado desde TT.5) | `src/data/managerInsights.ts` (nuevo · 7 selectors) · `src/components/timetracker/AttentionNeededCard.tsx` (nuevo) · `src/components/timetracker/UtilizationHeatmap.tsx` (nuevo) · `src/components/timetracker/OutlierCoachingCard.tsx` (nuevo) · `src/components/timetracker/MissingTimeDigest.tsx` (nuevo) · `src/components/timetracker/TrainingGapSparklines.tsx` (nuevo) · `src/components/timetracker/DesignerDrilldown.tsx` (nuevo) · `src/components/timetracker/TeamView.tsx` (nuevo · root) · `src/TimeTracker.tsx` (wired + placeholder removido) |
| TT.7 | EntryBlock legibilidad · aumentada opacity del background para mejorar contraste del texto interno (`bg-success/12→/25`, `bg-info/10→/20`, hover +10%) · agregado `ProjectChip` pill con HSL project hue (mismo hash que el rail izquierdo) · reemplaza el project name como texto plano · style inline con `hsl(hue 55% 55% / 0.20)` bg + `hsl(hue 55% 45% / 0.35)` border + `hsl(hue 60% 25%)` text · reconocibilidad cross-project + más compacto · texto interno (memo, time footer) sube a `text-foreground/70-80` (era muted-foreground · más legible) | `src/components/timetracker/WeeklyGrid.tsx` (tone bg + ProjectChip helper + rendering en MEDIUM + FULL layouts) |

(La tabla se irá llenando conforme se implementan las surfaces · ver `plan file` para el roadmap.)

## Non-goals heredados del cliente

- ❌ **NO** fixed per-task time menus (rechazo explícito · "caused more hurt than help")
- ❌ **NO** peers submit-on-behalf (solo manager)
- ❌ **NO** quitar future dating (necesario para holidays)
- ❌ **NO** surveillance features (screenshots · activity levels)
- ❌ **NO** required "reason for manual entry" (Hubstaff anti-pattern)
- ❌ **NO** copy tone surveillance · todo tone es **coaching** ("worth a check-in?", no "flagged")

## Stack

React 19 · Vite 7 · Tailwind 3 · TypeScript 5 · Headless UI · Framer Motion · Lucide · recharts · html2canvas · jspdf · workspace local `strata-design-system` (`packages/strata-ds`).

## Scripts

```bash
npm install         # instala + linkea workspace strata-ds
npm run dev         # dev server en http://localhost:8090
npm run build       # scan security + build strata-ds + vite build
npm run scan:security
npm run lint
```

## Sync policy

**Reglas heredadas del template `ack-vs-po-demo`** (todas aplican):
- No editar `src/components/comparison/*` (source of truth = expert-hub)
- No editar `ComparisonReviewModal` ni sus internals
- Toda adaptación con prefijo `TT.*` inline en el código + entrada en tabla arriba
- Preservar OCR + Comparisons + Feedback surfaces intactas (parte del expert-hub más reciente)

## Origen

Este proyecto responde al intake del cliente Wurkwel (discovery 29-jul-2026 · 4 MDs canónicos en `strata-docs/02-demo-projects/wurkwel/`) · shape decidido como standalone (no profile ni chapter) porque Wurkwel es un vertical distinto (time tracking) al expert-hub tradicional (OCR/Comparisons).
