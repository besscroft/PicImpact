import useSWR from 'swr'
import type { ImageServerHandleProps } from '~/types/props'

export const useSWRInfiniteServerHook = ({ handle, args }: ImageServerHandleProps, pageNum: number, tag: string)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR([args, pageNum],
    () => {
      return handle(pageNum, tag)
    }, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}