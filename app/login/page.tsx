import { UserFrom } from '~/components/login/user-from'
import Image from 'next/image'
import favicon from '~/public/favicon.svg'
import { getTranslations } from 'next-intl/server'

export default async function Login() {
  const t = await getTranslations()

  return (
    <div className="flex min-h-screen">
      {/* Left: Featured photo — hidden on mobile */}
      <div className="hidden lg:block lg:w-1/2 relative bg-muted">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-muted to-accent/20" />
        <div className="absolute bottom-8 left-8 right-8">
          <blockquote className="font-display text-2xl text-foreground/80 italic">
            &ldquo;Photography is the story I fail to put into words.&rdquo;
          </blockquote>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 lg:px-12">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-6 w-6 items-center justify-center">
                <Image
                  src={favicon}
                  alt="Logo"
                  width={36}
                  height={36}
                />
              </div>
              <h1 className="font-display text-3xl font-semibold">PicImpact</h1>
            </div>
            <p className="text-sm text-muted-foreground">{t('Login.signInDescription') || 'Sign in to continue'}</p>
          </div>

          <UserFrom />
        </div>
      </div>
    </div>
  )
}
