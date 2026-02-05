'use client'

import { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from './ConvexClientProvider'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider dynamic>
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ClerkProvider>
  )
}
