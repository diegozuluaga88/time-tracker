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
| TT.0 | Rename package + port 8090 + provenance | `package.json` · `vite.config.ts` · `README.md` · `CLAUDE.md` |
| TT.1 | Title HTML "Time Tracker" | `index.html` |

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
