import { ImageHandleProps } from '~/types'
import useSWR from 'swr'

export const useSWRInfiniteHook = ({ handle, args, tag }: ImageHandleProps, pageNum: number)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(`${args}-${pageNum}-${tag}`,
    () => {
      return handle(pageNum, tag)
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