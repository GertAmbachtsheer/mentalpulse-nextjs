'use client'

import { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider dynamic>
      {children}
    </ClerkProvider>
  )
}
