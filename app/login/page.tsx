import { UserFrom } from '~/components/login/UserFrom'
import { BackgroundBeamsWithCollision } from '~/components/ui/background-beams-with-collision'

export default function Login() {
  return (
    <BackgroundBeamsWithCollision>
      <div className="w-full h-screen m-auto">
        <div className="flex items-center justify-center py-12">
          <UserFrom/>
        </div>
      </div>
    </BackgroundBeamsWithCollision>
  )
}
