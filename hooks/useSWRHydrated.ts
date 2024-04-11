import useSWR from 'swr'
import { HandleProps } from '~/types'

export const useSWRHydrated = ({ handle, args }: HandleProps)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(args,
    () => {
      return handle()
    })

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}