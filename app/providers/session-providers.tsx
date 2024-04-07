import { SessionProvider } from 'next-auth/react'
import { auth } from '~/server/auth'

export async function SessionProviders({children}: { children: React.ReactNode }) {
  const session = await auth()

  if (session?.user) {
    // TODO: Look into https://react.dev/reference/react/experimental_taintObjectReference
    session.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    }
  }

  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
}