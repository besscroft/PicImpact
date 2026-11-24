# PicImpact UI Refactor (Impeccable Audit) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor PicImpact's entire UI based on Impeccable audit findings — warm up colors, unify design tokens, add motion, fix accessibility, improve responsiveness, and polish.

**Architecture:** Six sequential phases modifying `style/globals.css` (theme tokens), `app/layout.tsx` (font loading), and ~30 component files. Each phase is independently committable. Phase 1-2 (color/tokens) are foundational; Phase 3-6 can be partially parallelized.

**Tech Stack:** Next.js 16, Tailwind CSS v4, OKLch color space, next/font, motion/react (Framer Motion), Radix UI/shadcn

---

## Phase 1: Colorize — Warm Up the Color System

### Task 1.1: Replace Geist Sans with Warm Typography

**Files:**
- Modify: `app/layout.tsx` (font imports)
- Modify: `style/globals.css` (font variable references)

**Step 1: Update font imports in layout.tsx**

Replace the Geist font imports with a warm serif display font + humanist sans-serif body font. Use `next/font/google`.

In `app/layout.tsx`, add font imports at the top:

```tsx
import { Source_Serif_4, Source_Sans_3 } from 'next/font/google'

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '600', '700'],
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600'],
})
```

Update the `<html>` tag to apply font variables:

```tsx
<html className={`${sourceSerif.variable} ${sourceSans.variable} overflow-y-auto scrollbar-hide`} lang={locale} suppressHydrationWarning>
```

**Step 2: Update CSS font variable references**

In `style/globals.css`, update the `@theme inline` block:

```css
--font-sans: var(--font-sans), 'Source Sans 3', system-ui, sans-serif;
--font-mono: var(--font-geist-mono);
--font-display: var(--font-display), 'Source Serif 4', Georgia, serif;
```

Add to `@theme inline`:
```css
--font-display: var(--font-display);
```

**Step 3: Verify fonts load correctly**

Run: `pnpm run dev:server`
Expected: Pages render with Source Sans 3 for body text, Source Serif 4 available via `font-display` class.

**Step 4: Commit**

```bash
git add app/layout.tsx style/globals.css
git commit -m "feat(ui): replace Geist with Source Serif/Sans for warm typography"
```

---

### Task 1.2: Warm Up the OKLch Color Palette

**Files:**
- Modify: `style/globals.css` (`:root` and `.dark` sections, lines 81-148)

**Step 1: Replace cold neutral colors with warm-tinted palette**

Current colors use hue ~286 (cold purple-blue). Shift all neutrals toward hue ~45 (warm amber) with subtle chroma. Replace the `:root` block (lines 81-114):

```css
:root {
  --radius: 0.625rem;
  --background: oklch(0.985 0.008 65);
  --foreground: oklch(0.18 0.02 55);
  --card: oklch(0.995 0.005 65);
  --card-foreground: oklch(0.18 0.02 55);
  --popover: oklch(0.995 0.005 65);
  --popover-foreground: oklch(0.18 0.02 55);
  --primary: oklch(0.25 0.03 55);
  --primary-foreground: oklch(0.98 0.005 65);
  --secondary: oklch(0.955 0.012 65);
  --secondary-foreground: oklch(0.25 0.03 55);
  --muted: oklch(0.955 0.012 65);
  --muted-foreground: oklch(0.50 0.02 55);
  --accent: oklch(0.94 0.015 65);
  --accent-foreground: oklch(0.25 0.03 55);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.90 0.015 65);
  --input: oklch(0.90 0.015 65);
  --ring: oklch(0.65 0.04 55);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.975 0.008 65);
  --sidebar-foreground: oklch(0.18 0.02 55);
  --sidebar-primary: oklch(0.25 0.03 55);
  --sidebar-primary-foreground: oklch(0.98 0.005 65);
  --sidebar-accent: oklch(0.94 0.015 65);
  --sidebar-accent-foreground: oklch(0.25 0.03 55);
  --sidebar-border: oklch(0.90 0.015 65);
  --sidebar-ring: oklch(0.65 0.04 55);
}
```

Replace the `.dark` block (lines 116-148):

```css
.dark {
  --background: oklch(0.16 0.015 55);
  --foreground: oklch(0.96 0.008 65);
  --card: oklch(0.22 0.018 55);
  --card-foreground: oklch(0.96 0.008 65);
  --popover: oklch(0.22 0.018 55);
  --popover-foreground: oklch(0.96 0.008 65);
  --primary: oklch(0.90 0.015 65);
  --primary-foreground: oklch(0.22 0.018 55);
  --secondary: oklch(0.28 0.015 55);
  --secondary-foreground: oklch(0.96 0.008 65);
  --muted: oklch(0.28 0.015 55);
  --muted-foreground: oklch(0.65 0.02 55);
  --accent: oklch(0.28 0.015 55);
  --accent-foreground: oklch(0.96 0.008 65);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(0.96 0.008 65 / 12%);
  --input: oklch(0.96 0.008 65 / 15%);
  --ring: oklch(0.50 0.02 55);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.22 0.018 55);
  --sidebar-foreground: oklch(0.96 0.008 65);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.96 0.008 65);
  --sidebar-accent: oklch(0.28 0.015 55);
  --sidebar-accent-foreground: oklch(0.96 0.008 65);
  --sidebar-border: oklch(0.96 0.008 65 / 12%);
  --sidebar-ring: oklch(0.50 0.02 55);
}
```

Key changes:
- Background: Pure white → warm off-white (hue 65, slight cream tint)
- Foreground: Cold near-black → warm dark brown (hue 55)
- All neutrals: Shifted from hue 286 (blue-purple) → hue 55-65 (warm amber)
- Added subtle chroma (0.008-0.02) to all neutrals instead of near-zero
- muted-foreground lightness increased from 0.552 → 0.50 for better WCAG AA contrast

**Step 2: Update theme-color meta tag**

In `app/layout.tsx`, change:
```tsx
themeColor: '#000000',
```
to:
```tsx
themeColor: '#2d2518',
```

And update the meta tag:
```html
<meta name="theme-color" content="#2d2518" />
```

**Step 3: Verify visual output**

Run: `pnpm run dev:server`
Expected: Site has warm cream background (light) and warm dark background (dark), text is warm brown instead of blue-gray.

**Step 4: Commit**

```bash
git add style/globals.css app/layout.tsx
git commit -m "feat(ui): warm up color palette with amber-tinted OKLch neutrals"
```

---

## Phase 2: Normalize — Replace All Hardcoded Colors with Tokens

### Task 2.1: Add Missing Design Tokens

**Files:**
- Modify: `style/globals.css`

**Step 1: Add success/warning tokens and overlay token**

Add these to `:root` in globals.css, after `--ring`:

```css
--success: oklch(0.55 0.17 145);
--success-foreground: oklch(0.98 0.005 65);
--warning: oklch(0.75 0.18 80);
--warning-foreground: oklch(0.22 0.02 55);
--overlay: oklch(0.16 0.015 55 / 50%);
```

Add to `.dark`:
```css
--success: oklch(0.60 0.15 145);
--success-foreground: oklch(0.98 0.005 65);
--warning: oklch(0.70 0.16 80);
--warning-foreground: oklch(0.22 0.02 55);
--overlay: oklch(0.05 0.01 55 / 70%);
```

Add to `@theme inline`:
```css
--color-success: var(--success);
--color-success-foreground: var(--success-foreground);
--color-warning: var(--warning);
--color-warning-foreground: var(--warning-foreground);
--color-overlay: var(--overlay);
```

**Step 2: Commit**

```bash
git add style/globals.css
git commit -m "feat(ui): add success, warning, and overlay design tokens"
```

---

### Task 2.2: Replace Hardcoded Gray Colors in Gallery Components

**Files:**
- Modify: `components/gallery/simple/gallery-image.tsx`
- Modify: `components/album/blur-image.tsx`
- Modify: `components/album/tone-analysis.tsx`
- Modify: `components/album/preview-image.tsx`
- Modify: `components/album/preview-image-exif.tsx`
- Modify: `components/album/histogram-chart.tsx`

**Step 1: Replace all gray hardcoded classes**

Apply these replacements across all files above:

| Old Class | New Class |
|-----------|-----------|
| `text-gray-500` | `text-muted-foreground` |
| `dark:text-gray-50` | (remove — `text-muted-foreground` handles dark mode via CSS var) |
| `dark:text-gray-400` | (remove) |
| `text-gray-700` | `text-foreground` |
| `dark:text-gray-200` | (remove) |
| `text-gray-400` | `text-muted-foreground` |
| `dark:text-gray-800` | (remove) |
| `shadow-gray-200` | (remove — keep `shadow-sm` only) |
| `dark:shadow-gray-800` | (remove) |
| `border-gray-200/50` | `border-border/50` |
| `bg-gray-100/50` | `bg-muted/50` |
| `dark:border-gray-600/50` | (remove) |
| `dark:bg-gray-700/50` | (remove) |
| `dark:bg-gray-700` | (remove) |
| `bg-gray-900/80` | `bg-overlay` |

For `components/album/blur-image.tsx` line 17, change:
```
shadow-sm shadow-gray-200 dark:shadow-gray-800
```
to:
```
shadow-sm
```

For `components/album/preview-image.tsx` line 279, change:
```
<Separator className="dark:bg-gray-700" />
```
to:
```
<Separator className="bg-border" />
```

**Step 2: Verify lint passes**

Run: `pnpm run lint`
Expected: No new lint errors.

**Step 3: Commit**

```bash
git add components/gallery/ components/album/
git commit -m "refactor(ui): replace hardcoded gray colors with design tokens in gallery"
```

---

### Task 2.3: Replace Hardcoded Blue Colors in Admin Form Inputs

**Files:**
- Modify: `app/admin/settings/preferences/page.tsx`
- Modify: `components/admin/upload/simple-file-upload.tsx`
- Modify: `components/admin/upload/livephoto-file-upload.tsx`
- Modify: `components/admin/list/image-view.tsx`
- Modify: `components/admin/list/image-edit-sheet.tsx`
- Modify: `components/admin/album/album-edit-sheet.tsx`
- Modify: `components/admin/album/album-add-sheet.tsx`
- Modify: all files in `components/admin/settings/storages/`

**Step 1: Replace blue/gray form input pattern**

All these files share the same pattern for form labels:
```
border border-gray-200 ... focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600
```

Replace with:
```
border border-input ... focus-within:border-primary focus-within:ring-1 focus-within:ring-primary
```

Also replace `text-gray-700` in label text with `text-foreground`.

**Step 2: Replace progress bar blue**

In `components/album/progressive-image.tsx` line 117, change:
```
className="h-1 bg-blue-500"
```
to:
```
className="h-1 bg-primary"
```

**Step 3: Verify lint passes**

Run: `pnpm run lint`

**Step 4: Commit**

```bash
git add app/admin/ components/admin/ components/album/progressive-image.tsx
git commit -m "refactor(ui): replace hardcoded blue/gray colors with tokens in admin forms"
```

---

### Task 2.4: Replace Hardcoded Black/White Colors

**Files:**
- Modify: `components/album/progressive-image.tsx`
- Modify: `components/layout/theme/map/map-view.tsx`
- Modify: `components/layout/theme/polaroid/polaroid-gallery.tsx`
- Modify: `components/layout/dock-menu.tsx`
- Modify: `components/layout/command.tsx`
- Modify: `app/admin/about/page.tsx`
- Modify: `components/ui/dialog.tsx`
- Modify: `components/ui/sheet.tsx`
- Modify: `components/ui/drawer.tsx`
- Modify: `components/ui/alert-dialog.tsx`

**Step 1: Replace overlay backgrounds**

In `dialog.tsx`, `sheet.tsx`, `drawer.tsx`, `alert-dialog.tsx`:
```
bg-black/50
```
→
```
bg-overlay
```

In `progressive-image.tsx`:
- `bg-black/90` → `bg-background/95`
- `bg-black/60` → `bg-overlay`
- `text-white` on overlay context → `text-foreground`
- `bg-white/10` → `bg-foreground/10`
- `text-white/50` → `text-foreground/50`
- `text-white/70` → `text-foreground/70`
- `bg-black/50` → `bg-overlay`

**Step 2: Replace map component colors**

In `map-view.tsx`:
- `border-white dark:border-gray-800` → `border-background`
- `bg-white dark:bg-gray-800` → `bg-background`
- `bg-black/40 text-white hover:bg-black/60` → `bg-overlay text-foreground hover:bg-foreground/20`
- `text-white` on popup title → `text-card-foreground`

**Step 3: Replace miscellaneous**

In `polaroid-gallery.tsx`:
- `bg-white dark:bg-neutral-50` → `bg-card`

In `dock-menu.tsx`:
- `text-black dark:text-white` → `text-foreground`

In `command.tsx`:
- `text-zinc-600` → `text-muted-foreground`

In `app/admin/about/page.tsx`:
- `dark:text-white text-black` → `text-foreground`
- `border-black/[0.2] dark:border-white/[0.2]` → `border-foreground/20`

**Step 4: Replace green/yellow in storages**

In `components/admin/settings/storages/tabs-table-cell.tsx`:
- `bg-green-500 text-white dark:bg-green-600` → `bg-success text-success-foreground`
- `bg-yellow-500 text-white dark:bg-yellow-600` → `bg-warning text-warning-foreground`

**Step 5: Commit**

```bash
git add components/ app/admin/about/
git commit -m "refactor(ui): replace hardcoded black/white/zinc/green/yellow with design tokens"
```

---

## Phase 3: Animate — Add Purposeful Motion

### Task 3.1: Add Page Transition Animation

**Files:**
- Create: `components/layout/page-transition.tsx`
- Modify: `app/(default)/layout.tsx`

**Step 1: Create page transition wrapper**

```tsx
'use client'

import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}
```

**Step 2: Wrap default layout children**

In `app/(default)/layout.tsx`, wrap `{children}` with `<PageTransition>`.

**Step 3: Commit**

```bash
git add components/layout/page-transition.tsx app/\(default\)/layout.tsx
git commit -m "feat(ui): add subtle page transition animation"
```

---

### Task 3.2: Improve Card Entrance Animation

**Files:**
- Modify: `style/globals.css`

**Step 1: Speed up showUp animation**

Change line 162:
```css
animation: showUp 0.8s 0.5s backwards;
```
to:
```css
animation: showUp 0.4s 0.1s backwards;
```

Also update the keyframe (line 68-78) to use a subtler transform:
```css
@keyframes showUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Step 2: Commit**

```bash
git add style/globals.css
git commit -m "feat(ui): faster, subtler card entrance animation"
```

---

### Task 3.3: Add Image Hover Interaction

**Files:**
- Modify: `components/album/blur-image.tsx`

**Step 1: Add scale transform on hover**

The blur-image component wraps gallery images. Add a CSS transition for subtle hover zoom on the image container:

Add to the outer div class: `transition-transform duration-500 ease-out hover:scale-[1.02]`

**Step 2: Commit**

```bash
git add components/album/blur-image.tsx
git commit -m "feat(ui): add subtle hover scale on gallery images"
```

---

## Phase 4: Harden — Fix Accessibility

### Task 4.1: Add Skip-to-Content Link

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Add skip link before body content**

Add as the first child inside `<body>`:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
>
  Skip to content
</a>
```

**Step 2: Add main landmark**

In `app/(default)/layout.tsx`, wrap children in `<main id="main-content">`.
In `app/admin/layout.tsx`, ensure sidebar is in `<nav>` and content area is in `<main id="main-content">`.

**Step 3: Commit**

```bash
git add app/layout.tsx app/\(default\)/layout.tsx app/admin/layout.tsx
git commit -m "feat(a11y): add skip-to-content link and landmark elements"
```

---

### Task 4.2: Add Missing aria-labels

**Files:**
- Modify: `components/album/blur-image.tsx` (Live Photo icon)
- Modify: `components/gallery/simple/gallery-image.tsx` (Live Photo icon)
- Modify: `components/layout/theme/map/map-view.tsx` (close button, markers)

**Step 1: Add aria-labels to interactive elements lacking them**

For Live Photo SVG icons, wrap in a span with `aria-label`:
```tsx
<span aria-label="Live Photo" role="img">
  <svg ...>
</span>
```

For map close button, add `aria-label={t('Button.close')}`.

For map markers, ensure all have `aria-label` with image title.

**Step 2: Commit**

```bash
git add components/album/ components/gallery/ components/layout/
git commit -m "feat(a11y): add missing aria-labels to interactive elements"
```

---

## Phase 5: Adapt — Responsive Improvements

### Task 5.1: Add Fluid Typography

**Files:**
- Modify: `style/globals.css`

**Step 1: Add fluid type scale using clamp()**

Add to `@layer base`:

```css
:root {
  --text-sm: clamp(0.8125rem, 0.78rem + 0.16vw, 0.875rem);
  --text-base: clamp(0.9375rem, 0.88rem + 0.29vw, 1rem);
  --text-lg: clamp(1.0625rem, 0.97rem + 0.45vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.28rem + 1.1vw, 2rem);
}
```

**Step 2: Commit**

```bash
git add style/globals.css
git commit -m "feat(ui): add fluid typography scale with clamp()"
```

---

### Task 5.2: Fix Admin Preferences Grid

**Files:**
- Modify: `app/admin/settings/preferences/page.tsx`

**Step 1: Reduce grid columns**

Change `lg:grid-cols-4` to `lg:grid-cols-3` for better readability on large screens.

**Step 2: Commit**

```bash
git add app/admin/settings/preferences/page.tsx
git commit -m "fix(ui): reduce preferences grid to 3 columns for readability"
```

---

## Phase 6: Polish — Final Pass

### Task 6.1: Apply Display Font to Key Headings

**Files:**
- Modify: `components/album/preview-image.tsx` (image title)
- Modify: `components/album/preview-image-exif.tsx` (section headings)
- Modify: `components/layout/theme/polaroid/polaroid-gallery.tsx` (polaroid titles)
- Modify: `app/admin/page.tsx` (dashboard heading)

**Step 1: Apply font-display to display headings**

For key visual headings (gallery title, preview image title, section banners), add `font-display` class:

```tsx
<h2 className="font-display text-xl font-semibold">...</h2>
```

Don't change body text, labels, or UI text — only prominent display headings that benefit from the serif character.

**Step 2: Commit**

```bash
git add components/album/ components/layout/ app/admin/page.tsx
git commit -m "feat(ui): apply display serif font to key headings"
```

---

### Task 6.2: Add Spacing Rhythm Improvements

**Files:**
- Modify: `components/album/preview-image.tsx`
- Modify: `app/(default)/page.tsx` or gallery layout files

**Step 1: Increase gallery outer padding**

In gallery layouts, change `p-2` to `p-4 sm:p-6 lg:p-8` for better breathing room.

**Step 2: Add varied spacing in preview**

In preview-image.tsx, increase section gaps from `space-y-4` to `space-y-6` for major sections, keep `space-y-2` for tight metadata groups.

**Step 3: Commit**

```bash
git add components/ app/
git commit -m "feat(ui): improve spacing rhythm with varied section gaps"
```

---

### Task 6.3: Final Lint Check and Build Verification

**Step 1: Run full lint**

Run: `pnpm run lint`
Expected: No errors.

**Step 2: Run production build**

Run: `pnpm run build`
Expected: Build succeeds with no errors.

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve lint and build issues from UI refactor"
```

---

## Summary

| Phase | Tasks | Estimated Files |
|-------|-------|-----------------|
| 1. Colorize | 2 tasks | 2 files |
| 2. Normalize | 4 tasks | ~30 files |
| 3. Animate | 3 tasks | 3 files |
| 4. Harden | 2 tasks | 6 files |
| 5. Adapt | 2 tasks | 2 files |
| 6. Polish | 3 tasks | ~8 files |
| **Total** | **16 tasks** | **~30 unique files** |
