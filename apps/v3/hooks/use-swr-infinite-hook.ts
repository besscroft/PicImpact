import type { ImageHandleProps } from '~/types/props'
import useSWR from 'swr'

export const useSwrInfiniteHook = ({ handle, args, album }: ImageHandleProps, pageNum: number)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(`${args}-${pageNum}-${album}`,
    () => {
      return handle(pageNum, album)
    }, {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    })

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate,
  }
}