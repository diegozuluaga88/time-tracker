# 🎨 Brand Color Pattern Update

## ✅ Nueva Regla Implementada

### Pattern Completo (Light + Dark + Hover)

```tsx
className="bg-brand-300 dark:bg-brand-500 text-zinc-900 hover:bg-brand-400 dark:hover:bg-brand-600/50"
```

### Breakdown por Modo

| Estado | Light Mode | Dark Mode |
|--------|-----------|-----------|
| **Base** | `bg-brand-300` | `dark:bg-brand-500` |
| **Hover** | `hover:bg-brand-400` | `dark:hover:bg-brand-600/50` (50% opacity) |
| **Text** | `text-zinc-900` | `text-zinc-900` |

## 📝 Cambios Realizados

### Scripts Actualizados

#### ✅ `scripts/audit-design-tokens.mjs`
- Detecta `bg-brand-400` sin dark mode → Sugiere `bg-brand-300 dark:bg-brand-500`
- Detecta `dark:bg-brand-400` sin hover → Sugiere `dark:bg-brand-500`
- Nuevo check para brand-400 en dark mode base (debe ser brand-500)

#### ✅ `scripts/fix-design-tokens.mjs`
- Fix: `bg-brand-400` → `bg-brand-300 dark:bg-brand-500`
- Fix: `dark:bg-brand-400` (no hover) → `dark:bg-brand-500`

### Documentación Actualizada

#### ✅ `DESIGN_SYSTEM_RULES.md`
- Todas las referencias a `dark:bg-brand-400` → `dark:bg-brand-500`
- Tabla de reglas actualizada con columna Hover State
- Ejemplos actualizados con pattern completo
- Reglas de dark mode actualizadas

#### ✅ `QUICKSTART_AUDIT.md`
- Todos los ejemplos actualizados
- Prompts de IA actualizados
- Sección de brand color actualizada
- Ejemplos de buttons y cards actualizados

#### ✅ `scripts/README.md`
- Todas las referencias actualizadas al nuevo pattern

## 🎯 Resumen de la Regla

### ✅ CORRECTO

```tsx
// Button con pattern completo
<Button className="bg-brand-300 dark:bg-brand-500 text-zinc-900 hover:bg-brand-400 dark:hover:bg-brand-600/50">
  Submit
</Button>

// Card con brand action
<Card className="bg-white dark:bg-zinc-900">
  <Button className="bg-brand-300 dark:bg-brand-500 text-zinc-900 hover:bg-brand-400 dark:hover:bg-brand-600/50">
    Action
  </Button>
</Card>
```

### ❌ INCORRECTO

```tsx
// Falta dark mode variant
<Button className="bg-brand-400 text-zinc-900">
  Submit
</Button>

// Dark mode usando brand-400 como base (debe ser brand-500)
<Button className="bg-brand-300 dark:bg-brand-400 text-zinc-900">
  Submit
</Button>

// Sin hover states
<Button className="bg-brand-300 dark:bg-brand-500 text-zinc-900">
  Submit
</Button>
```

## 🚀 Próximos Pasos

### 1. Ejecutar Auditoría

```bash
cd ds-selection/dealer
npm run audit:tokens
```

**Resultado esperado:** El auditor ahora detectará:
- Casos de `dark:bg-brand-400` sin `hover:` como violaciones
- Sugerirá usar `brand-500` en dark mode base

### 2. Aplicar Auto-Fix

```bash
# Previsualizar cambios
npm run fix:tokens:dry

# Aplicar fixes
npm run fix:tokens
```

**Resultado esperado:**
- Cambiará `bg-brand-400` sin dark mode → `bg-brand-300 dark:bg-brand-500`
- Cambiará `dark:bg-brand-400` (no hover) → `dark:bg-brand-500`

### 3. Fixes Manuales

Algunos casos requerirán revisión manual:
- Botones que ya tienen hover states personalizados
- Components complejos con múltiples estados
- Casos donde brand-400 se usa intencionalmente (borders, accents)

### 4. Verificar

```bash
npm run audit:tokens
```

**Objetivo:** 0 violaciones de BRAND_MISUSE

## 📊 Impacto Estimado

De las **960 violaciones actuales**, este cambio afectará:

- **BRAND_MISUSE**: ~50-100 casos nuevos detectados
- **Auto-fixable**: ~80% de los casos de brand-400

## 🎨 Rationale del Cambio

### ¿Por qué brand-500 en dark mode?

1. **Mayor contraste:** brand-500 (`#b4eb00`) tiene mejor contraste contra zinc-900
2. **Jerarquía visual:** brand-500 es más oscuro, establece mejor jerarquía en dark mode
3. **Hover suave con opacidad:** brand-600/50 proporciona feedback visual sutil pero visible

### Pattern de Interacción

```
Light Mode:
  Reposo:  brand-300 (suave) ━━━━━━━━━━━┓
  Hover:   brand-400 (más intenso) ━━━┛

Dark Mode:
  Reposo:  brand-500 (oscuro) ━━━━━━━━━━━┓
  Hover:   brand-600/50 (sutil) ━━━━━━┛
           (brand-600 con 50% opacidad)
```

## ✅ Checklist de Implementación

- [x] Scripts de auditoría actualizados
- [x] Scripts de fix actualizados
- [x] DESIGN_SYSTEM_RULES.md actualizado
- [x] QUICKSTART_AUDIT.md actualizado
- [x] scripts/README.md actualizado
- [ ] Ejecutar `npm run audit:tokens`
- [ ] Ejecutar `npm run fix:tokens`
- [ ] Revisar cambios con `git diff`
- [ ] Tests manuales en light/dark mode
- [ ] Commit de cambios

---

**Fecha de actualización:** 2026-02-12
**Autor:** Claude Code + Usuario
**Versión:** 1.0
