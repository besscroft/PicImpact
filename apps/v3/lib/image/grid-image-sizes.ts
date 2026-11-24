/**
 * Single source of truth for each theme's grid `<img sizes>` attribute.
 *
 * The server-rendered LCP preload hint (`components/gallery/gallery-preload-hints`)
 * MUST emit an `imagesizes` byte-identical to the `sizes` of the rendered grid
 * `<img>`. Otherwise the preload scanner and next/image run their candidate
 * selection against different `sizes` and may pick different srcset widths,
 * causing a wasted double download. Importing the same constant in both places
 * makes that drift impossible.
 */

// Default masonry theme (components/gallery/masonry-photo-item.tsx).
export const DEFAULT_GRID_SIZES = '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'

// Simple single-column feed theme (components/gallery/simple/gallery-image.tsx).
export const SIMPLE_GRID_SIZES = '(min-width: 768px) 75vw, 100vw'

// Polaroid draggable-cards theme (components/layout/theme/polaroid/polaroid-gallery.tsx).
export const POLAROID_GRID_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'

/**
 * Resolve the grid `<img sizes>` for a theme selector value (`custom_index_style`
 * on the home page, or an album's `theme` field): '1' = simple, '2' = polaroid,
 * anything else = default. Used by the server preload hint to match the theme
 * that will actually render.
 */
export function gridSizesForTheme(theme: string | undefined): string {
  if (theme === '1') {
    return SIMPLE_GRID_SIZES
  }
  if (theme === '2') {
    return POLAROID_GRID_SIZES
  }
  return DEFAULT_GRID_SIZES
}
