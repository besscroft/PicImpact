import useSWR from 'swr'
import type { ImageServerHandleProps } from '~/types/props'

export const useSwrInfiniteServerHook = ({ handle, args }: ImageServerHandleProps, pageNum: number, tag: string, showStatus: number = -1)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR([args, pageNum, showStatus],
    () => {
      return handle(pageNum, tag, showStatus)
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