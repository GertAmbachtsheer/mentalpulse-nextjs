'use client'

import { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import UserStoreInitializer from '@/components/UserStoreInitializer'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider dynamic>
      <UserStoreInitializer />
      {children}
    </ClerkProvider>
  )
}
