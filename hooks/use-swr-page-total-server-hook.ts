import useSWR from 'swr'
import type { ImageServerHandleProps } from '~/types/props'

export const useSwrPageTotalServerHook = (
  { args, totalHandle }: ImageServerHandleProps,
  pageSize: number,
  tag: string,
  showStatus: number = -1,
  camera: string = '',
  lens: string = ''
) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [args, pageSize, tag, showStatus, camera, lens],
    () => {
      return totalHandle(tag, showStatus, camera, lens, pageSize)
    }
  )

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}