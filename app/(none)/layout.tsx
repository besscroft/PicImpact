import '~/style/globals.css'
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
        <Providers>
          <Toaster position="top-right" />
          {children}
        </Providers>
      </body>
    </html>
  );
}