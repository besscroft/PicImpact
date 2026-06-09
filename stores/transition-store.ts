import { create } from 'zustand'

// Source thumbnail captured at click time, used to drive the shared-element
// (FLIP) transition from the grid into the detail view. Purely ephemeral
// client state — never persisted or SSR-hydrated — so unlike the other stores
// it uses a plain global `create` store instead of the vanilla+provider pattern
// (which exists to hydrate persisted state and brings no benefit here).
export interface TransitionSource {
  /** The clicked photo's id (the photo the detail view opens on). */
  id: string
  /** Viewport rect of the thumbnail image at click time. */
  rect: { top: number; left: number; width: number; height: number }
  /** The exact (already-decoded/cached) src the grid was showing, so the flying
   *  element shows real pixels with no extra request or flash. */
  src: string
  /** photo.width / photo.height — the grid cell is rendered at this aspect, and
   *  so is the detail's contained image, so the FLIP is a clean uniform scale. */
  aspect: number
}

interface TransitionState {
  source: TransitionSource | null
  setSource: (source: TransitionSource) => void
  clear: () => void
}

export const useTransitionStore = create<TransitionState>((set) => ({
  source: null,
  setSource: (source) => set({ source }),
  clear: () => set({ source: null }),
}))
