import useSWR from 'swr'
import { HandleProps } from '~/types'

export const useSWRHydrated = ({ handle, args }: HandleProps)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(args,
    () => {
      return handle()
    }, { revalidateOnFocus: false })

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}