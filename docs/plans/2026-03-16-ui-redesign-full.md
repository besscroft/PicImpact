# PicImpact Full UI Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign PicImpact's entire UI inspired by Afilmory — immersive masonry gallery, fullscreen photo viewer with inspector panel, split-screen auth, and streamlined admin.

**Architecture:** 4 independent phases. Each phase is a PR-ready deliverable. Phases modify different page areas with minimal overlap.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, motion/react, Radix UI, shadcn/ui, Zustand, SWR

**Reference:** https://github.com/Afilmory/afilmory

---

## Phase 1: Gallery Redesign (Highest Visual Impact)

### Task 1.1: Replace Dock Menu with Fixed Top Navigation Bar

**Files:**
- Delete: `components/layout/dock-menu.tsx` (replace entirely)
- Create: `components/layout/top-nav.tsx`
- Modify: `app/(default)/layout.tsx`
- Modify: `components/ui/origin/dock.tsx` (may keep for admin or remove)

**What to build:**

A fixed top navigation bar with blur background:

```tsx
<header className="fixed top-0 inset-x-0 z-50">
  {/* Blur backdrop */}
  <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
  <nav className="relative flex h-12 items-center justify-between px-4">
    {/* Left: Site name */}
    <Link href="/" className="font-display text-lg font-semibold">
      {config.title || 'PicImpact'}
    </Link>

    {/* Center: Album tabs (horizontal scroll on mobile) */}
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
      {albums.map(album => (
        <Link
          key={album.id}
          href={`/${album.album_value}`}
          className={cn(
            'rounded-full px-3 py-1 text-sm transition-colors',
            isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {album.name}
        </Link>
      ))}
    </div>

    {/* Right: Theme toggle + Map link + Admin link */}
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <Link href="/map">Map</Link>
    </div>
  </nav>
</header>
```

Update `app/(default)/layout.tsx` to use `<TopNav>` instead of `<DockMenu>`, add `pt-12` to content area.

---

### Task 1.2: Redesign Default Gallery — Immersive Masonry

**Files:**
- Rewrite: `components/layout/theme/default/default-gallery.tsx`
- Rewrite: `components/album/blur-image.tsx`
- Create: `components/gallery/masonry-photo-item.tsx`
- Modify: `style/globals.css` (add hover overlay utilities)

**What to build:**

**MasonryPhotoItem** — the core gallery item:

```tsx
<div
  className="group relative cursor-pointer overflow-hidden"
  style={{ width, height: width / aspectRatio }}
  onClick={() => router.push(`/preview/${photo.id}`)}
>
  {/* Thumbhash placeholder */}
  {photo.blurhash && <BlurHashPlaceholder hash={photo.blurhash} className="absolute inset-0" />}

  {/* Image with hover zoom */}
  <Image
    src={photo.preview_url || photo.url}
    alt={photo.title || ''}
    fill
    className="object-cover transition-transform duration-500 group-hover:scale-105"
    loading="lazy"
  />

  {/* Hover overlay — bottom gradient + info */}
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
    {/* Title */}
    <h3 className="truncate text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
      {photo.title}
    </h3>

    {/* EXIF grid — 2x2 frosted badges */}
    {photo.exif && (
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {photo.exif.f_number && (
          <div className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 backdrop-blur-md">
            <ApertureIcon className="h-3 w-3 text-white/70" />
            <span className="text-white/90">ƒ/{photo.exif.f_number}</span>
          </div>
        )}
        {/* Same pattern for shutter_speed, focal_length_35mm, iso_speed_rating */}
      </div>
    )}
  </div>

  {/* Live Photo badge */}
  {photo.type === 2 && (
    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
      <LivePhotoIcon className="h-3.5 w-3.5" />
      <span>Live</span>
    </div>
  )}
</div>
```

**Default Gallery** — CSS columns-based masonry:

```tsx
<div className="columns-2 gap-1 sm:columns-3 lg:columns-4 xl:columns-5 px-1 sm:px-2 pt-14">
  {photos.map(photo => (
    <div key={photo.id} className="mb-1 break-inside-avoid">
      <MasonryPhotoItem photo={photo} />
    </div>
  ))}
</div>
```

Using CSS `columns` for true masonry layout — simpler than JS-based masonry and natively supported.

---

### Task 1.3: Update Simple Gallery for Immersive Style

**Files:**
- Rewrite: `components/layout/theme/simple/simple-gallery.tsx`
- Rewrite: `components/gallery/simple/gallery-image.tsx`

Simple gallery becomes a single-column editorial layout:
- Full-width images with generous vertical spacing
- Title + EXIF below each image (not hover)
- No cards, no shadows — images float directly

---

### Task 1.4: Update Tag Gallery Page

**Files:**
- Modify: `app/(default)/tag/[...tag]/page.tsx`

Use the same masonry layout and `MasonryPhotoItem` component. Add a tag header pill showing the active filter.

---

## Phase 2: Fullscreen Photo Viewer

### Task 2.1: Build Fullscreen Viewer Shell

**Files:**
- Rewrite: `app/@modal/(...)preview/[id]/modal.tsx`
- Rewrite: `app/@modal/(...)preview/[id]/page.tsx`
- Create: `components/viewer/photo-viewer.tsx`
- Create: `components/viewer/photo-viewer-controls.tsx`

**What to build:**

Fullscreen viewer with dark backdrop, centered image, navigation:

```tsx
<div className="fixed inset-0 z-[100] bg-background/95 flex">
  {/* Main image area */}
  <div className="flex-1 flex items-center justify-center relative">
    {/* Close button — top left */}
    <Button variant="ghost" className="absolute top-4 left-4 z-10" onClick={onClose}>
      <X />
    </Button>

    {/* Previous / Next arrows */}
    <Button className="absolute left-4 top-1/2 -translate-y-1/2" onClick={goPrev}>
      <ChevronLeft />
    </Button>
    <Button className="absolute right-4 top-1/2 -translate-y-1/2" onClick={goNext}>
      <ChevronRight />
    </Button>

    {/* Image */}
    <motion.div key={photo.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Image src={photo.url} ... />
    </motion.div>
  </div>

  {/* Inspector panel — desktop only */}
  <InspectorPanel photo={photo} className="hidden lg:block w-80 border-l" />
</div>
```

Keyboard: `←` `→` navigate, `Escape` close, `i` toggle inspector.

---

### Task 2.2: Build Inspector Panel

**Files:**
- Create: `components/viewer/inspector-panel.tsx`
- Refactor from: `components/album/preview-image.tsx` and `preview-image-exif.tsx`

Right-side panel (320px) containing:
- Photo title (font-display, text-xl)
- Camera + lens badge
- 2x2 EXIF grid (frosted glass cards matching hover overlay style)
- Date & location
- Collapsible histogram / tone analysis
- Download original link
- Tags

Mobile: Same content in a bottom Drawer (using Vaul or existing Drawer component).

---

### Task 2.3: Integrate WebGL Viewer

**Files:**
- Modify: `components/viewer/photo-viewer.tsx`
- Keep: `components/album/progressive-image.tsx` (WebGL logic)

Integrate existing WebGL viewer into the new fullscreen shell. Double-click or pinch to zoom.

---

### Task 2.4: Left/Right Navigation with Transition

**Files:**
- Modify: `components/viewer/photo-viewer.tsx`
- Create: `hooks/use-photo-navigation.ts`

Hook that manages:
- Current photo index in album
- Keyboard arrow navigation
- Touch swipe detection
- Preload adjacent images
- `AnimatePresence` with `translateX` + opacity transition

---

## Phase 3: Login/Signup Redesign

### Task 3.1: Split-Screen Login Page

**Files:**
- Rewrite: `app/login/page.tsx`
- Rewrite: `components/login/user-from.tsx`

**Desktop layout:**
```tsx
<div className="flex h-screen">
  {/* Left: Featured photo */}
  <div className="hidden lg:block lg:w-1/2 relative">
    <Image src={randomPhoto} fill className="object-cover" />
    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/30" />
  </div>

  {/* Right: Login form */}
  <div className="flex flex-1 items-center justify-center px-8">
    <div className="w-full max-w-sm space-y-8">
      <h1 className="font-display text-3xl">{siteName}</h1>
      {/* form fields — no Card wrapper */}
      <Input placeholder="Email" className="h-12" />
      <Input type="password" placeholder="Password" className="h-12" />
      <Button className="w-full h-12">Sign in</Button>
      {/* Passkey / 2FA options */}
    </div>
  </div>
</div>
```

**Mobile:** Background image (darkened) + overlaid form.

---

### Task 3.2: Split-Screen Signup Page

**Files:**
- Rewrite: `app/sign-up/page.tsx`
- Rewrite: `components/sign-up/sign-up-from.tsx`

Same split-screen pattern as login.

---

## Phase 4: Admin Dashboard Redesign

### Task 4.1: Streamline Admin Layout

**Files:**
- Modify: `app/admin/layout.tsx`
- Modify: `components/layout/admin/app-sidebar.tsx`

Collapse sidebar to icon-only (48px) by default, expand on hover/click. Content area gets more room.

---

### Task 4.2: Redesign Dashboard Page

**Files:**
- Rewrite: `app/admin/page.tsx`

Key metrics row (3 cards: photos / albums / storage) + recent uploads grid (masonry thumbnails).

---

### Task 4.3: Image Management — Grid/List Toggle

**Files:**
- Rewrite: `components/admin/list/list-image.tsx`
- Modify: `components/admin/list/image-view.tsx`
- Modify: `components/admin/list/image-edit-sheet.tsx`

Add view toggle (grid | list). Grid = dense thumbnails with checkbox overlay. List = table rows with inline expand-to-edit.

---

### Task 4.4: Upload Page Enhancement

**Files:**
- Modify: `app/admin/upload/page.tsx` (or relevant upload page)
- Modify: `components/admin/upload/simple-file-upload.tsx`
- Modify: `components/admin/upload/livephoto-file-upload.tsx`

Larger drag zone, inline progress bars, preview thumbnails during upload.

---

## Execution Order

| Phase | Tasks | Impact | Est. Files |
|-------|-------|--------|------------|
| 1. Gallery | 4 tasks | Highest — what users see first | ~10 files |
| 2. Viewer | 4 tasks | High — core photo experience | ~8 files |
| 3. Auth | 2 tasks | Medium — first-time impression | ~4 files |
| 4. Admin | 4 tasks | Lower — admin only | ~10 files |

Start with Phase 1 for maximum visual impact.
