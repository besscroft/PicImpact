import Link from 'next/link'
import { fetchConfigsByKeys } from '~/server/db/query/configs'

export default async function Logo() {
  const data = await fetchConfigsByKeys([
    'custom_title',
  ])

  return (
    <Link href="/" className="select-none">
      { data[0].config_value ?? 'PicImpact' }
    </Link>
  );
}