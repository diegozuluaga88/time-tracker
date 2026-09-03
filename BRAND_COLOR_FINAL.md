# 🎨 Brand Color Pattern - REGLA FINAL

## ✅ Regla Definitiva (Actualizada)

### Pattern Completo

```tsx
className="bg-brand-300 dark:bg-brand-500 text-zinc-900 hover:bg-brand-400 dark:hover:bg-brand-600/50"
```

### Tabla de Colores por Modo y Estado

| Modo | Estado | Color | Valor Hex | Opacidad |
|------|--------|-------|-----------|----------|
| **Light** | Base | `bg-brand-300` | `#edff58` | 100% |
| **Light** | Hover | `hover:bg-brand-400` | `#d6ff3c` | 100% |
| **Dark** | Base | `dark:bg-brand-500` | `#b4eb00` | 100% |
| **Dark** | Hover | `dark:hover:bg-brand-600/50` | `#8bc200` | **50%** |
| **Ambos** | Text | `text-zinc-900` | `#18181b` | 100% |

---

## 📝 Resumen de Cambios

### Cambio 1: Dark Mode Base
❌ **Antes:** `dark:bg-brand-400`
✅ **Ahora:** `dark:bg-brand-500`

### Cambio 2: Dark Mode Hover
❌ **Antes:** `dark:hover:bg-brand-400`
✅ **Ahora:** `dark:hover:bg-brand-600/50` (con 50% de opacidad)

---

## 🎯 Ejemplos Correctos

### Button Primario

```tsx
<Button className="bg-brand-300 dark:bg-brand-500 text-zinc-900 hover:bg-brand-400 dark:hover:bg-brand-600/50">
  Submit
</Button>
```

### Card con Brand Action

```tsx
<Card className="bg-white dark:bg-zinc-900 border-t-4 border-brand-400">
  <CardContent>
    <h3 className="text-zinc-900 dark:text-white">Title</h3>
    <p className="text-zinc-600 dark:text-zinc-400">Description</p>
    <Button className="bg-brand-300 dark:bg-brand-500 text-zinc-900 hover:bg-brand-400 dark:hover:bg-brand-600/50">
      Action
    </Button>
  </CardContent>
</Card>
```

### Link con Brand Color

```tsx
<a href="#" className="text-brand-300 dark:text-brand-500 hover:text-brand-400 dark:hover:text-brand-600/50">
  Learn More
</a>
```

---

## ❌ Ejemplos Incorrectos

### 1. Sin Dark Mode Variant

```tsx
// ❌ INCORRECTO
<Button className="bg-brand-400 text-zinc-900">
  Submit
</Button>

// ✅ CORRECTO
<Button className="bg-brand-300 dark:bg-brand-500 text-zinc-900 hover:bg-brand-400 dark:hover:bg-brand-600/50">
  Submit
</Button>
```

### 2. Dark Mode con Brand-400

```tsx
// ❌ INCORRECTO
<Button className="bg-brand-300 dark:bg-brand-400 text-zinc-900">
  Submit
</Button>

// ✅ CORRECTO
<Button className="bg-brand-300 dark:bg-brand-500 text-zinc-900">
  Submit
</Button>
```

### 3. Dark Hover sin Opacidad

```tsx
// ❌ INCORRECTO
<Button className="bg-brand-300 dark:bg-brand-500 hover:bg-brand-400 dark:hover:bg-brand-400">
  Submit
</Button>

// ✅ CORRECTO
<Button className="bg-brand-300 dark:bg-brand-500 hover:bg-brand-400 dark:hover:bg-brand-600/50">
  Submit
</Button>
```

### 4. Sin Hover States

```tsx
// ❌ INCORRECTO (funciona pero no es completo)
<Button className="bg-brand-300 dark:bg-brand-500 text-zinc-900">
  Submit
</Button>

// ✅ CORRECTO (pattern completo)
<Button className="bg-brand-300 dark:bg-brand-500 text-zinc-900 hover:bg-brand-400 dark:hover:bg-brand-600/50">
  Submit
</Button>
```

---

## 🔍 Detección Automática

El auditor ahora detecta:

1. ✅ `bg-brand-400` sin dark mode → Error
2. ✅ `dark:bg-brand-400` → Error (debe ser `brand-500`)
3. ✅ `dark:hover:bg-brand-400` → Error (debe ser `brand-600/50`)
4. ✅ `dark:hover:bg-brand-500` → Error (debe ser `brand-600/50`)

---

## 🛠️ Auto-Fix

El fixer automático corrige:

1. ✅ `bg-brand-400` → `bg-brand-300 dark:bg-brand-500`
2. ✅ `dark:bg-brand-400` → `dark:bg-brand-500`
3. ✅ `dark:hover:bg-brand-400` → `dark:hover:bg-brand-600/50`
4. ✅ `dark:hover:bg-brand-500` → `dark:hover:bg-brand-600/50`

---

## 🚀 Comandos de Ejecución

### 1. Auditar (ver violaciones)

```bash
cd ds-selection/dealer
npm run audit:tokens
```

### 2. Preview de fixes (sin modificar)

```bash
npm run fix:tokens:dry
```

### 3. Aplicar fixes automáticos

```bash
npm run fix:tokens
```

### 4. Re-auditar (verificar corrección)

```bash
npm run audit:tokens
```

---

## 🎨 Rationale del Pattern

### ¿Por qué brand-500 en dark mode base?

✅ Mejor contraste contra `zinc-900` background
✅ Establece jerarquía visual clara
✅ Color más oscuro para modo oscuro

### ¿Por qué brand-600/50 en hover?

✅ Feedback visual sutil pero perceptible
✅ Opacidad del 50% evita saturación excesiva
✅ Transición suave en dark mode
✅ Mantiene accesibilidad

---

## 📊 Progresión Visual

```
Light Mode:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reposo:  ████████ brand-300 (#edff58)
         ↓ hover
Hover:   ██████ brand-400 (#d6ff3c)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dark Mode:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reposo:  ████ brand-500 (#b4eb00)
         ↓ hover
Hover:   ██ brand-600/50 (#8bc200 @ 50%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🤖 Prompt para IA

Usa este prompt cuando generes código con IA:

```
Genera un componente siguiendo Strata Design System:

BRAND COLOR PATTERN (OBLIGATORIO):
- Light mode base: bg-brand-300
- Light mode hover: hover:bg-brand-400
- Dark mode base: dark:bg-brand-500
- Dark mode hover: dark:hover:bg-brand-600/50

Pattern completo:
bg-brand-300 dark:bg-brand-500 hover:bg-brand-400 dark:hover:bg-brand-600/50

COLORES ESTRUCTURALES:
- zinc-* para backgrounds, borders, text
- red-* para errores
- green-* para éxito
- amber-* para warnings
- indigo-* para info

NUNCA USAR:
- lime, yellow, purple, orange, emerald, cyan
- Hex colors (#...)
- RGB colors

TEXT EN BRAND:
- Siempre text-zinc-900 o text-black (AAA contrast)
```

---

## ✅ Checklist Final

Antes de commit:

- [ ] Pattern completo usado: `bg-brand-300 dark:bg-brand-500 hover:bg-brand-400 dark:hover:bg-brand-600/50`
- [ ] Ejecutado `npm run audit:tokens` → 0 errores de BRAND_MISUSE
- [ ] Verificado visualmente en light mode
- [ ] Verificado visualmente en dark mode
- [ ] Hover states funcionan correctamente
- [ ] Text color es `text-zinc-900` en brand backgrounds

---

## 📚 Referencias

- **Esta guía:** `BRAND_COLOR_FINAL.md`
- **Reglas completas:** `DESIGN_SYSTEM_RULES.md`
- **Quick Start:** `QUICKSTART_AUDIT.md`
- **Scripts técnicos:** `scripts/README.md`
- **Change log:** `BRAND_COLOR_UPDATE.md`

---

**Fecha:** 2026-02-12
**Versión:** 2.0 FINAL
**Estado:** ✅ REGLA OFICIAL
