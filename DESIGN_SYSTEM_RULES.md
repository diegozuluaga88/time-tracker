# Strata Design System - Token Usage Rules

This document defines the strict rules for using Strata Design System tokens in the Dealer application.

## 🎨 Color Palette

### Allowed Color Scales

Strata Design System provides the following color scales:

| Scale | Usage | Example |
|-------|-------|---------|
| **brand-*** | Primary signal color (Volt Lime #D6FF3C) | Actions, highlights, active states |
| **zinc-*** | Structural/neutral colors | Backgrounds, borders, text |
| **red-*** | Destructive actions, errors | Delete buttons, error states |
| **green-*** | Success states, confirmations | Success messages, completed states |
| **blue-*** | Information, links | Info alerts, hyperlinks |
| **amber-*** | Warnings, pending states | Warning alerts, pending badges |
| **indigo-*** | Charts, data visualization | Chart colors, analytics |

### ❌ Forbidden Colors

The following Tailwind color scales are **NOT** part of Strata DS and must **NEVER** be used:

- ❌ `lime-*` → Use `brand-*` instead
- ❌ `yellow-*` → Use `amber-*` instead
- ❌ `purple-*` → Use `indigo-*` instead
- ❌ `violet-*` → Use `indigo-*` instead
- ❌ `orange-*` → Use `amber-*` instead
- ❌ `emerald-*` → Use `green-*` instead
- ❌ `cyan-*` → Use `blue-*` instead
- ❌ `sky-*` → Use `blue-*` instead
- ❌ `pink-*`, `rose-*`, `fuchsia-*`, `teal-*` → Not in Strata palette

## 🌓 Brand Color Rules (Light vs Dark Mode)

The **brand color** (Volt Lime) has **different usage patterns** in light and dark modes for accessibility.

### Light Mode Strategy: "Clean / Brand Soft"

```tsx
// ✅ CORRECT - Light mode primary action
<Button className="bg-brand-300 dark:bg-brand-500 text-zinc-900 hover:bg-brand-400 dark:hover:bg-brand-600/50">
  Submit
</Button>

// ✅ CORRECT - Light mode card accent
<Card className="bg-white dark:bg-zinc-900 border-t-4 border-brand-400">
  <CardContent>...</CardContent>
</Card>

// ❌ WRONG - brand-400 without dark mode variant
<Button className="bg-brand-400 text-zinc-900">Submit</Button>
```

**Rules:**
- **Primary Actions:** Use `bg-brand-300` in light mode
- **Hover State:** Use `hover:bg-brand-400` in light mode
- **Accents/Borders:** Use `brand-400` for decorative elements
- **Text on Brand:** Always use `text-zinc-900` or `text-black` (AAA contrast)

### Dark Mode Strategy: "Brand Signal"

```tsx
// ✅ CORRECT - Dark mode brand signal
<Button className="bg-brand-300 dark:bg-brand-500 text-zinc-900 hover:bg-brand-400 dark:hover:bg-brand-600/50">
  Submit
</Button>

// ✅ CORRECT - Dark mode card with brand accent
<Card className="bg-white dark:bg-zinc-900 border-brand-400/30 dark:border-brand-400">
  <CardContent>...</CardContent>
</Card>
```

**Rules:**
- **Primary Actions:** Use `bg-brand-500` in dark mode (base state)
- **Hover State:** Use `dark:hover:bg-brand-600/50` in dark mode (brand-600 with 50% opacity)
- **Accents/Borders:** `brand-400` for clear boundaries
- **Text:** Use `text-white` or `text-zinc-100` for primary text

## 🚫 Hardcoded Colors

### Never Use Hex/RGB Colors

```tsx
// ❌ WRONG - Hardcoded hex
<div style={{ backgroundColor: '#D6FF3C' }}>...</div>

// ❌ WRONG - Hardcoded RGB
<div style={{ color: 'rgb(214, 255, 60)' }}>...</div>

// ✅ CORRECT - Use Tailwind classes with Strata tokens
<div className="bg-brand-400 text-zinc-900">...</div>
```

### Exception: Chart Libraries

When using chart libraries like Recharts, use Strata token values:

```tsx
// ✅ ACCEPTABLE - Reference Strata token values
const COLORS = [
  "#D6FF3C", // brand-400 (Volt Lime)
  "#FFFFFF", // white
  "#71717A", // zinc-500
  "#3F3F46"  // zinc-700
];

// 💡 BETTER - Import from Strata tokens
import { tokens } from 'strata-design-system/tokens';

const COLORS = [
  tokens['color-brand-400'],
  tokens['color-white'],
  tokens['color-zinc-500'],
  tokens['color-zinc-700'],
];
```

## 📋 Common Mappings

### Status Colors

```tsx
// Success
className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"

// Warning
className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"

// Error
className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"

// Info
className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
```

### Backgrounds

```tsx
// Page background
className="bg-white dark:bg-zinc-900"

// Card background
className="bg-white dark:bg-zinc-800"

// Subtle background
className="bg-zinc-50 dark:bg-zinc-900"

// Hover state
className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
```

### Text Colors

```tsx
// Primary text
className="text-zinc-900 dark:text-white"

// Secondary text
className="text-zinc-600 dark:text-zinc-400"

// Muted text
className="text-zinc-500 dark:text-zinc-500"

// Brand text
className="text-brand-400"
```

### Borders

```tsx
// Default border
className="border-zinc-200 dark:border-zinc-800"

// Subtle border
className="border-zinc-100 dark:border-zinc-900"

// Brand border
className="border-brand-400"
```

## 🛠️ Auditing & Fixing

### Audit Your Code

```bash
npm run audit:tokens
```

This will scan all files and report violations.

### Auto-Fix Violations

```bash
# Dry run (preview changes)
npm run fix:tokens:dry

# Apply fixes
npm run fix:tokens
```

### Pre-Commit Hook (Recommended)

Add this to `.husky/pre-commit`:

```bash
#!/bin/sh
npm run audit:tokens
```

## 📚 References

- **Brand Styling Guide:** `Strata Design System/guidelines/BRAND_STYLING.md`
- **Token Definitions:** `Strata Design System/src/tokens/tokens.ts`
- **CSS Variables (Light):** `Strata Design System/src/styles/tokens/variables.css`
- **CSS Variables (Dark):** `Strata Design System/src/styles/tokens/variables-dark.css`

## 🤖 AI Code Generation

When using AI to generate code:

1. **Always reference this document** in your prompt
2. **Run the auditor** after AI-generated changes
3. **Review violations** and apply fixes

Example prompt:

```
Generate a modal component following Strata Design System rules:
- Use brand-300 for primary actions in light mode, brand-400 in dark mode
- Use zinc-* for structural colors
- Never use lime, yellow, purple colors
- Follow the patterns in DESIGN_SYSTEM_RULES.md
```

## ✅ Quick Checklist

Before committing code:

- [ ] No `lime-*`, `yellow-*`, `purple-*` classes used
- [ ] No hardcoded hex colors (except in chart configs)
- [ ] Brand color used correctly (brand-300 light, brand-400 dark)
- [ ] Dark mode variants provided for all color classes
- [ ] Ran `npm run audit:tokens` with zero violations
- [ ] Text on brand backgrounds uses `text-zinc-900` or `text-black`

---

**Questions?** Refer to Strata Design System documentation or run the auditor for guidance.
