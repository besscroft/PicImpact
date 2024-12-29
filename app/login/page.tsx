import { UserFrom } from '~/components/login/UserFrom'
import Image from 'next/image'
import favicon from '~/public/favicon.svg'
import Link from 'next/link'

export default function Login() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium select-none">
          <div className="flex h-6 w-6 items-center justify-center">
            <Image
              src={favicon}
              alt="Logo"
              width={36}
              height={36}
            />
          </div>
          PicImpact
        </Link>
        <UserFrom/>
      </div>
    </div>
  )
}
