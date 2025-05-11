import useSWR from 'swr'
import type { ImageServerHandleProps } from '~/types/props'

export const useSwrInfiniteServerHook = (
  { handle, args }: ImageServerHandleProps,
  pageNum: number,
  tag: string,
  showStatus: number = -1,
  camera: string = '',
  lens: string = ''
) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [args, pageNum, tag, showStatus, camera, lens],
    () => {
      return handle(pageNum, tag, showStatus, camera, lens)
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  )

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}