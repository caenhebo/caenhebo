'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    } else {
      // Redirect based on user role
      switch (session.user.role) {
        case 'ADMIN':
          router.push('/admin')
          break
        case 'BUYER':
          router.push('/buyer/dashboard')
          break
        case 'SELLER':
          router.push('/seller/dashboard')
          break
        default:
          router.push('/')
      }
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  )
}