import '~/style/globals.css'
import { Providers } from '~/app/providers/providers'
import { ToasterProviders } from '~/app/providers/toaster-providers'

export default function RootLayout({
 children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ToasterProviders />
          {children}
        </Providers>
      </body>
    </html>
  );
}