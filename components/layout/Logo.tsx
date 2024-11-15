import Image from 'next/image'
import favicon from '~/public/favicon.svg'
import Link from 'next/link'
import { fetchCustomInfo } from '~/server/db/query'

export default async function Logo() {
  const data = await fetchCustomInfo()

  return (
    <Link href="/" className="select-none">
      <Image
        src={data?.find((item: any) => item.config_key === 'custom_favicon_url')?.config_value || favicon}
        alt="Logo"
        width={36}
        height={36}
      />
    </Link>
  );
}