# time-tracker · Demo standalone time tracking · Wurkwel-inspired

**Contexto**: clon de `ack-vs-po-demo@f9f83e1` (2026-09-03) · versión más reciente de expert-hub. Feature nuevo = `Time Tracker` tab con 2 surfaces (My Timesheet designer / Team View manager). Ver [README.md](README.md) + [plan file](../../../../.claude/plans/cuddly-greeting-meadow.md) para el diseño completo.

**Sync policy heredada** (locked):
- **No editar** `src/components/comparison/*` ni el `ComparisonReviewModal` · fuente de verdad = expert-hub.
- OCR + Comparisons + Feedback surfaces se preservan intactas del template.
- Toda adaptación con prefijo `TT.*` (Time Tracker) inline en el código + entrada en README table.

**Coaching copy tone (obligatorio)**:
- ❌ *"Flagged: unusual entry"*
- ✅ *"Kate logged 5.5h on Block Plan Onboarding — 2h above her 4-week avg. Worth a check-in?"*
- Toda copy relacionada a outliers/warnings/alerts debe usar tone coaching, nunca surveillance.
- Documentar copy en `src/data/coachingCopy.ts` para consistency.

**Non-goals del cliente** (locked):
- ❌ Fixed per-task time menus
- ❌ Peers submit-on-behalf
- ❌ Quitar future dating
- ❌ Surveillance features (screenshots/activity)
- ❌ Required "reason for manual entry"

**Base research**:
- `strata-docs/02-demo-projects/wurkwel/wurkwel-benchmark-2026-09-03.md` (deep benchmark de 5 competitors)
- `strata-docs/02-demo-projects/wurkwel/wurkwel-value-hypothesis.md` (ranking de 7 pains)
- Artifact visual: https://claude.ai/code/artifact/88d19761-1ce5-42d1-86c5-429b29bdd047

---

# Strata Design System — Reglas para este proyecto

Antes de crear o modificar cualquier componente, consultar el MCP server `strata-ds`:

```
get_overview          → contexto completo (usar al iniciar trabajo nuevo)
get_laws              → leyes absolutas del DS
get_tokens            → referencia de tokens CSS/Tailwind
get_rules(category)   → reglas: color-tokens | brand-colors | containers-and-cards | buttons-and-actions | icons
get_anti_patterns     → errores documentados a evitar
search_governance(q)  → búsqueda en toda la governance
```

Ver instrucciones completas en: `c:/Users/User/Documents/design-system/CLAUDE.md`
