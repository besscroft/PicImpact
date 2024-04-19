import Image from 'next/image'
import favicon from '~/public/favicon.svg'
import Link from 'next/link'

export default function Logo() {
  return (
    <Link href="/" className="select-none">
      <Image
        src={favicon}
        alt="Logo"
        width={36}
        height={36}
      />
    </Link>
 );
}