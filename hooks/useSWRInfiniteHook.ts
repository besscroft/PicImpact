import { ImageHandleProps } from '~/types'
import useSWR from 'swr'

export const useSWRInfiniteHook = ({ handle, args, album }: ImageHandleProps, pageNum: number)   => {
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