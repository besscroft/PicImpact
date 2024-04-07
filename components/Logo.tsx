import Image from 'next/image'
import favicon from '~/public/favicon.svg'
import Link from 'next/link'

export default function Logo() {
  return (
    <Link href="/">
      <Image
        src={favicon}
        alt="Picture of the author"
        width={36}
        height={36}
      />
    </Link>
 );
}