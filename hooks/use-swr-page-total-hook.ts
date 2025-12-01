import useSWR from 'swr'
import type { ImageHandleProps } from '~/types/props'

export const useSwrPageTotalHook = ({ args, totalHandle, album }: ImageHandleProps)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR([args, album],
    () => {
      // Call with optional camera/lens parameters as undefined for backward compatibility
      return totalHandle(album, undefined, undefined)
    })

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}