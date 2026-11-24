import useSWR from 'swr'
import type { ImageServerHandleProps } from '~/types/props'

export const useSwrPageTotalServerHook = (
  { args, totalHandle }: ImageServerHandleProps,
  tag: string,
  showStatus: number = -1,
  camera: string = '',
  lens: string = ''
) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [args, tag, showStatus, camera, lens],
    () => {
      return totalHandle(tag, showStatus, camera, lens)
    }
  )

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}