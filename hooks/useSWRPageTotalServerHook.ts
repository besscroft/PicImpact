import useSWR from 'swr'
import { ImageServerHandleProps } from '~/types'

export const useSWRPageTotalServerHook = ({ args, totalHandle }: ImageServerHandleProps, tag: string)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR([args, tag],
    () => {
      return totalHandle(tag)
    })

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}