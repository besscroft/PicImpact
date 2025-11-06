import React from 'react'

export default async function ThemeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <>
      {children}
    </>
  )
}
