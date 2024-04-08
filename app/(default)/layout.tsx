import Header from '~/components/Header'
import Transitions, { Animate } from '~/components/Transitions'

export default async function DefaultLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Transitions className="h-full flex flex-col">
        <Header/>
        <Animate className="flex-1">
          {children}
        </Animate>
      </Transitions>
    </>
  );
}
