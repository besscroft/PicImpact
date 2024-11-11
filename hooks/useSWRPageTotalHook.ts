import useSWR from 'swr'
import { ImageHandleProps } from '~/types'

export const useSWRPageTotalHook = ({ args, totalHandle, album }: ImageHandleProps)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR([args, album],
    () => {
      return totalHandle(album)
    })

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}