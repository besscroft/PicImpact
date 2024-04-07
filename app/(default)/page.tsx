'use client'

import React from 'react'
import Image from "next/image"
import fufu from '~/public/112962239_p0.jpg'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between">
      <Image
        width={360}
        src={fufu}
        alt="芙芙"
      />
    </main>
  );
}
