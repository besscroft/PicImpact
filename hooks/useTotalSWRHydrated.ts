import useSWR from 'swr'
import { HandleListProps } from '~/types'

export const useTotalSWRHydrated = ({ args, totalHandle }: HandleListProps)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(args,
    () => {
      return totalHandle()
    })

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}