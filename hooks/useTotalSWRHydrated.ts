import useSWR from 'swr'
import { HandleListProps } from '~/types'

export const useTotalSWRHydrated = ({ args, totalHandle, total }: HandleListProps)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(args,
    () => {
      return totalHandle()
    }, {
      fallbackData: total
    })

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}