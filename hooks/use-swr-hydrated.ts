import { useEffect } from 'react'
import useSWR from 'swr'

// Module-level cache of the last successfully-resolved result per SWR key.
// On a client-side (soft) navigation the consuming component re-mounts and the
// value was observed to come back undefined on the first render after the
// re-mount — which made config-derived UI (e.g. the gallery's variantBaseUrl)
// fall back to a degraded state (AVIF variants → preview JPGs on returning from
// the detail page). Feeding the last value as `fallbackData` makes the config
// available immediately on re-mount, so consumers never lose it across
// navigation; SWR still revalidates in the background.
const lastResolved = new Map<string, unknown>()

export const useSwrHydrated = <T = unknown>({ handle, args }: { handle: () => Promise<T>, args: string }) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(args,
    () => {
      return handle()
    }, { revalidateOnFocus: false, fallbackData: lastResolved.get(args) as T | undefined })

  useEffect(() => {
    if (data !== undefined) {
      lastResolved.set(args, data)
    }
  }, [args, data])

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}
