import Image from "next/image"
import fufu from '~/public/112962239_p0.jpg'
import { UserFrom } from '~/components/login/UserFrom'

export default function Login() {
  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <div className="hidden bg-muted lg:block">
        <Image
          src={fufu}
          alt="Image"
          className="h-full w-full object-cover dark:brightness-[0.2]"
          style={{
            width: 'auto',
            height: '100%',
          }}
        />
      </div>
      <div className="flex items-center justify-center py-12">
        <UserFrom />
      </div>
    </div>
  )
}