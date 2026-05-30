'use client'

import type { ComponentType } from 'react'
import dynamic from 'next/dynamic'
import { Masonry } from 'masonic'

/**
 * Reusable windowed masonry wrapper built on `masonic`.
 *
 * Replaces the previous CSS multi-column layout (`columns-*` + `break-inside-avoid`),
 * which reflowed and reordered every prior item whenever a new page appended and
 * mounted the entire accumulated dataset as live DOM. `masonic` measures items once,
 * positions them absolutely with stable coordinates, and only mounts the items that
 * are within the viewport (+ overscan) against the page scroll.
 *
 * masonic touches `window` synchronously, so the inner masonry is loaded with
 * `next/dynamic` + `ssr: false` to stay SSR-safe.
 */
export interface VirtualMasonryItem {
  id: string | number
}

interface VirtualMasonryProps<T extends VirtualMasonryItem> {
  items: T[]
  render: ComponentType<{ index: number; data: T; width: number }>
  columnGutter?: number
  columnWidth?: number
  columnCount?: number
  maxColumnCount?: number
  className?: string
  overscanBy?: number
  // ARIA role for the masonry container. masonic derives the item role from it
  // ("list" → "listitem", "grid" → "gridcell"). Defaults to "list": a photo
  // gallery is a list of links, and "grid" was invalid here because masonic
  // nests gridcells directly under the grid with no intervening "row"
  // (tripping aria-required-children / aria-required-parent). "list"/"listitem"
  // is a valid parent/child pair with no row requirement.
  role?: 'list' | 'grid'
}

function VirtualMasonryInner<T extends VirtualMasonryItem>({
  items,
  render,
  columnGutter = 4,
  columnWidth,
  columnCount,
  maxColumnCount,
  // Render this many viewport-heights of extra content beyond what's visible.
  // A larger overscan preloads rows before they scroll into view, so fast
  // scrolling doesn't outrun item mount + image load/decode (which left blank
  // cells, especially for slower-decoding AVIF).
  overscanBy = 5,
  role = 'list',
}: Readonly<VirtualMasonryProps<T>>) {
  return (
    <Masonry
      items={items}
      render={render}
      role={role}
      columnGutter={columnGutter}
      columnWidth={columnWidth}
      columnCount={columnCount}
      maxColumnCount={maxColumnCount}
      overscanBy={overscanBy}
      // Keep masonry positions stable as new pages append by keying off the
      // stable item id rather than the array index.
      itemKey={(data) => data.id}
    />
  )
}

const ClientMasonry = dynamic(() => Promise.resolve(VirtualMasonryInner), {
  ssr: false,
}) as typeof VirtualMasonryInner

export default function VirtualMasonry<T extends VirtualMasonryItem>(
  props: Readonly<VirtualMasonryProps<T>>
) {
  const { className, ...rest } = props
  return (
    <div className={className}>
      <ClientMasonry {...rest} />
    </div>
  )
}
