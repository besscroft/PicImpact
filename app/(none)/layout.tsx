import '~/style/globals.css'
import { UserStoreProvider } from '~/app/providers/userStoreProvider'
import { Providers } from '~/app/providers/providers'
import { Toaster } from 'sonner'

export default function RootLayout({
 children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <body>
    <UserStoreProvider>
      <Providers>
        <Toaster position="top-right" />
        {children}
      </Providers>
    </UserStoreProvider>
    </body>
    </html>
  );
}