export const fetcher = async (url: string) => {
  const res = await fetch(url).then((r) => r.json())
  if (res && typeof res === 'object' && 'code' in res && 'data' in res) {
    return res.data
  }
  return res
}
