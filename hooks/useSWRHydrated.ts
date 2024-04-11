import useSWR from 'swr'
import { HandleProps } from '~/types'
import { toast } from 'sonner'

export const useSWRHydrated = ({ handle, args }: HandleProps)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(args,
    () => {
      return handle()
    }, { revalidateOnFocus: false })

  if (error) {
    toast.error('获取失败！')
  }

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}