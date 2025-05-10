'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEffect } from 'react'

interface AccessCheckProps {
  allowedRoles: string[]
  children: React.ReactNode
}

export function AccessCheck({ allowedRoles, children }: AccessCheckProps) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }

    if (user && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized')
    }
  }, [user, router, allowedRoles])

  if (!user || !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}