# 🚀 Quick Start: Design System Auditor

## ¿Qué es esto?

Un sistema automatizado que **detecta y corrige** violaciones del **Strata Design System** en tu código.

## 📦 ¿Qué incluye?

✅ **Auditor** - Escanea tu código y reporta violaciones
✅ **Auto-Fixer** - Corrige automáticamente la mayoría de problemas
✅ **Reglas documentadas** - Guía completa de uso de tokens
✅ **Integración CI/CD** - Previene commits con violaciones

## ⚡ Uso Rápido

### 1. Auditar tu código

```bash
npm run audit:tokens
```

**Resultado:** Reporte con todas las violaciones encontradas.

### 2. Previsualizar fixes

```bash
npm run fix:tokens:dry
```

**Resultado:** Muestra qué cambios se harían sin modificar archivos.

### 3. Aplicar fixes

```bash
npm run fix:tokens
```

**Resultado:** Corrige automáticamente violaciones comunes.

### 4. Re-auditar

```bash
npm run audit:tokens
```

**Resultado:** Verifica que todo esté correcto.

## 📊 Ejemplo Real

### Antes (❌ 960 violaciones)

```tsx
// ❌ VIOLACIONES:
// - purple no está en Strata (usa indigo)
// - yellow no está en Strata (usa amber)
// - Hex hardcoded
// - Sin dark mode variant

export function BadCard() {
  return (
    <div className="bg-purple-500 border-yellow-400">
      <h2 style={{ color: '#8b5cf6' }}>Title</h2>
      <button className="bg-brand-400">Action</button>
    </div>
  );
}
```

### Después (✅ Compliant)

```tsx
// ✅ CORRECTO:
// - indigo (parte de Strata)
// - amber (parte de Strata)
// - Clases Tailwind con tokens
// - Dark mode variants

export function GoodCard() {
  return (
    <div className="bg-indigo-500 dark:bg-indigo-600 border-amber-400 dark:border-amber-500">
      <h2 className="text-indigo-500 dark:text-indigo-400">Title</h2>
      <button className="bg-brand-300 dark:bg-brand-500 text-zinc-900">Action</button>
    </div>
  );
}
```

## 🎯 Reglas Principales

### ✅ USAR estos colores:

- `brand-*` → Volt Lime (#D6FF3C) - Color de marca
- `zinc-*` → Grises estructurales
- `red-*` → Errores/destructivo
- `green-*` → Éxito
- `blue-*` → Información
- `amber-*` → Advertencias
- `indigo-*` → Charts/analytics

### ❌ NUNCA usar:

- `lime-*` → Usa `brand-*`
- `yellow-*` → Usa `amber-*`
- `purple-*` → Usa `indigo-*`
- `orange-*` → Usa `amber-*`
- Hex colors como `#8b5cf6`
- RGB colors como `rgb(139, 92, 246)`

### 🌓 Brand Color (Volt Lime)

```tsx
// ✅ CORRECTO - Light mode usa brand-300, dark mode usa brand-500
<Button className="bg-brand-300 dark:bg-brand-500 text-zinc-900 hover:bg-brand-400 dark:hover:bg-brand-600/50">
  Submit
</Button>

// ❌ INCORRECTO - Falta variant de dark mode
<Button className="bg-brand-400 text-zinc-900">
  Submit
</Button>
```

## 🔄 Workflow Recomendado

### Para desarrollo nuevo:

1. Escribe tu código
2. Ejecuta `npm run audit:tokens`
3. Ejecuta `npm run fix:tokens`
4. Revisa cambios manualmente
5. Commit

### Para código generado con IA:

```bash
# Después de que la IA genere código:
npm run audit:tokens       # Ver violaciones
npm run fix:tokens         # Corregir automáticamente
npm run audit:tokens       # Verificar que se arregló
```

### Prompt recomendado para IA:

```
Genera un componente siguiendo Strata Design System:

COLORES PERMITIDOS:
- brand-* (Volt Lime) - Acciones primarias
- zinc-* - Estructurales
- red-*, green-*, blue-*, amber-*, indigo-*

NUNCA USAR:
- lime, yellow, purple, orange, emerald, cyan

REGLAS DE BRAND COLOR:
- Light mode base: bg-brand-300
- Light mode hover: hover:bg-brand-400
- Dark mode base: dark:bg-brand-500
- Dark mode hover: dark:hover:bg-brand-600/50 (50% opacity)
- Pattern completo: bg-brand-300 dark:bg-brand-500 hover:bg-brand-400 dark:hover:bg-brand-600/50

Referencias:
- DESIGN_SYSTEM_RULES.md
```

## 🛡️ Pre-Commit Hook (Prevenir violaciones)

### Instalar Husky:

```bash
npm install --save-dev husky
npx husky init
```

### Agregar audit al pre-commit:

```bash
echo "npm run audit:tokens" > .husky/pre-commit
```

Ahora cada `git commit` ejecutará el auditor primero. Si hay violaciones, el commit fallará.

## 📈 Estadísticas del Proyecto

**Estado actual (después de ejecutar audit):**

- 📊 **960 violaciones** en 58 archivos
- ❌ **901 errores** (colores prohibidos, hex hardcoded)
- ⚠️ **59 warnings** (brand color misuse, RGB colors)

**Breakdown por tipo:**

- `FORBIDDEN_COLOR`: 810 (purple → indigo, yellow → amber, etc.)
- `HARDCODED_HEX`: 108 (#8b5cf6, #D6FF3C, etc.)
- `HARDCODED_RGB`: 33 (rgb(...))
- `BRAND_MISUSE`: 9 (bg-brand-400 sin dark variant)

**Auto-fixable:**

- ✅ **728 violaciones** se corrigen automáticamente (76%)
- ⚠️ **232 violaciones** requieren revisión manual (24%)

## 📚 Documentación Completa

- **Reglas detalladas:** [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md)
- **Scripts técnicos:** [scripts/README.md](./scripts/README.md)
- **Brand Guidelines:** `../../Strata Design System/guidelines/BRAND_STYLING.md`
- **Tokens:** `../../Strata Design System/src/tokens/tokens.ts`

## 🆘 Troubleshooting

### "Module not found"

Asegúrate de estar en el directorio correcto:

```bash
cd ds-selection/dealer
npm run audit:tokens
```

### "Too many violations"

Es normal si nunca has auditado antes. Usa el workflow:

```bash
npm run fix:tokens      # Auto-corrige 70-80%
npm run audit:tokens    # Ver qué queda
# Arregla manualmente los restantes
```

### "False positives"

Algunos casos (como colores en charts) pueden ser legítimos. Puedes:

1. Documentar la excepción con comentario
2. Usar tokens de Strata en lugar de hex
3. Agregar a allowlist del auditor

### ¿Cómo saber qué token usar?

Consulta el mapeo en [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md) o:

```bash
# Ver todos los tokens disponibles
cat ../../Strata\ Design\ System/src/tokens/tokens.ts
```

## 🎓 Ejemplos por Caso de Uso

### Badges de estado

```tsx
// Success
<Badge className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
  Active
</Badge>

// Warning
<Badge className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
  Pending
</Badge>

// Error
<Badge className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
  Failed
</Badge>
```

### Cards con brand accent

```tsx
// Light mode: clean white bg, brand-300 action
// Dark mode: zinc-900 bg, brand-500 action, brand-400 hover
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

### Buttons primarios

```tsx
// Primary action (brand) - pattern completo
<Button className="bg-brand-300 dark:bg-brand-500 text-zinc-900 hover:bg-brand-400 dark:hover:bg-brand-600/50">
  Submit
</Button>

// Secondary action (zinc)
<Button className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700">
  Cancel
</Button>

// Destructive action (red)
<Button className="bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700">
  Delete
</Button>
```

## ✅ Checklist Pre-Commit

Antes de hacer commit:

- [ ] Ejecuté `npm run audit:tokens`
- [ ] Cero violaciones (o documentadas)
- [ ] Revisé los cambios del auto-fixer
- [ ] Probé en light y dark mode
- [ ] Brand color usa pattern correcto (brand-300/brand-400)
- [ ] Todos los colores tienen dark mode variants

## 🤝 Contribuir

Si encuentras un patrón común no detectado:

1. Edita `scripts/audit-design-tokens.mjs`
2. Agrega el patrón a `REPLACEMENTS`
3. Prueba con `npm run audit:tokens`
4. Documenta en `DESIGN_SYSTEM_RULES.md`

---

**¿Dudas?** Lee la [documentación completa](./DESIGN_SYSTEM_RULES.md) o consulta el [Strata Design System](../../Strata%20Design%20System/README.md).
