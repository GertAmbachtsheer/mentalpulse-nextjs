'use client'

import { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import ClerkSupabaseBridge from '@/components/ClerkSupabaseBridge'
import UserStoreInitializer from '@/components/UserStoreInitializer'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider dynamic>
      <ClerkSupabaseBridge />
      <UserStoreInitializer />
      {children}
    </ClerkProvider>
  )
}
