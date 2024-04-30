import useSWR from 'swr'
import { ImageServerHandleProps } from '~/types'

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