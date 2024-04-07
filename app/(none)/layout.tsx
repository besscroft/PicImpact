import '~/style/globals.css'
import { Providers } from '~/app/providers/providers'
import { ToasterProviders } from '~/app/providers/toaster-providers'
import { SessionProviders } from '~/app/providers/session-providers'

export default function RootLayout({
 children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProviders>
          <Providers>
            <ToasterProviders />
            {children}
          </Providers>
        </SessionProviders>
      </body>
    </html>
  );
}