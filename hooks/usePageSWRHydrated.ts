import useSWR from 'swr'
import { HandleListProps } from '~/types'

export const usePageSWRHydrated = ({ handle, args, data: images }: HandleListProps, pageNum: number)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR([args, pageNum],
    () => {
      return handle(pageNum)
    }, {
    revalidateOnFocus: false,
    fallbackData: pageNum === 1 ? images : undefined
  })

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}