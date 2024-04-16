import useSWR from 'swr'
import { HandleListProps } from '~/types'

export const usePageSWRHydrated = ({ handle, args }: HandleListProps, pageNum: number)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR([args, pageNum],
    () => {
      return handle(pageNum)
    }, {
    revalidateOnFocus: false,
  })

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}