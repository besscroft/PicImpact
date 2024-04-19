import useSWR from 'swr'
import { ImageHandleProps } from '~/types'

export const useSWRPageTotalHook = ({ args, totalHandle, tag }: ImageHandleProps)   => {
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