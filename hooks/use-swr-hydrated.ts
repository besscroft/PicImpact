import useSWR from 'swr'

export const useSwrHydrated = <T = unknown>({ handle, args }: { handle: () => Promise<T>, args: string }) => {
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
