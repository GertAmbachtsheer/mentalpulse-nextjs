'use client'

import { ReactNode } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/nextjs'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!

if (!convexUrl) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL in your .env file')
}

// Create the Convex client once at module level to prevent recreating on every render
const convex = new ConvexReactClient(convexUrl)

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}