'use client'

import { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from './ConvexClientProvider'
import PanicAlertListener from './PanicAlertListener'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider dynamic>
      <ConvexClientProvider>
        <PanicAlertListener />
        {children}
      </ConvexClientProvider>
    </ClerkProvider>
  )
}
