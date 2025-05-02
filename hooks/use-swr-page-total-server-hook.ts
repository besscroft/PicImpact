import useSWR from 'swr'
import type { ImageServerHandleProps } from '~/types/props'

export const useSwrPageTotalServerHook = ({ args, totalHandle }: ImageServerHandleProps, tag: string, showStatus: number = -1)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR([args, tag, showStatus],
    () => {
      return totalHandle(tag, showStatus)
    })

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}