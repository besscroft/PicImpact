export const DEFAULT_THEME_VALUES = ['light', 'dark', 'system'] as const

export type DefaultTheme = (typeof DEFAULT_THEME_VALUES)[number]

export function normalizeDefaultTheme(value: string | null | undefined): DefaultTheme {
  return value === 'light' || value === 'dark' || value === 'system'
    ? value
    : 'light'
}
