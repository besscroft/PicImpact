import Link from 'next/link'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { Button } from '~/components/ui/button'

export default async function Logo() {
  const data = await fetchConfigsByKeys([
    'custom_title',
  ])

  return (
    <Link href="/" className="select-none">
      <Button variant="link" className="cursor-pointer">{ data[0].config_value ?? 'PicImpact' }</Button>
    </Link>
  )
}