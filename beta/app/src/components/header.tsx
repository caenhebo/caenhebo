'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import NotificationBell from '@/components/notifications/notification-bell'

export default function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-blue-600 cursor-pointer">Caenhebo Alpha</h1>
            </Link>
          </div>
          <nav className="flex items-center space-x-4">
            {status === 'loading' ? (
              <span className="text-gray-500">Loading...</span>
            ) : session ? (
              <>
                <span className="text-sm text-gray-600 mr-2">
                  <User className="inline h-4 w-4 mr-1" />
                  {session.user.email}
                </span>
                <NotificationBell userId={session.user.id} className="mr-2" />
                {session.user.role === 'ADMIN' && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm">Admin Dashboard</Button>
                  </Link>
                )}
                {session.user.role === 'BUYER' && (
                  <Link href="/buyer/dashboard">
                    <Button variant="ghost" size="sm">Buyer Dashboard</Button>
                  </Link>
                )}
                {session.user.role === 'SELLER' && (
                  <Link href="/seller/dashboard">
                    <Button variant="ghost" size="sm">Seller Dashboard</Button>
                  </Link>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Force logout through API route which properly clears cookies
                    window.location.href = '/api/auth/logout'
                  }}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}