'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { SumSubLauncher } from '@/components/kyc/sumsub-launcher'
import Header from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

function KycVerifyPageContent() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sumsubToken, setSumsubToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Get the token from the URL or session
    const token = searchParams.get('token') || session.user.kycSessionId
    if (token) {
      setSumsubToken(token)
      setLoading(false)
    } else {
      setError('No verification token found')
      setLoading(false)
    }
  }, [session, status, searchParams, router])

  const handleKycComplete = async () => {
    // Update session to reflect KYC submission
    await update()
    // Redirect to callback page
    router.push('/kyc/callback')
  }

  const handleKycError = async (error: any) => {
    console.error('KYC error:', error)
    
    // If token error, try to get a fresh one
    if (error?.message?.includes('token') || error?.code === 'TOKEN_EXPIRED') {
      setError('Session expired. Getting a new verification session...')
      try {
        const response = await fetch('/api/kyc/refresh-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const { token } = await response.json()
          // Reload page with new token
          window.location.href = `/kyc/verify?token=${token}`
        } else {
          setError('Failed to refresh session. Please go back and try again.')
        }
      } catch (err) {
        setError('Failed to refresh session. Please go back and try again.')
      }
    } else {
      setError('Verification failed. Please try again.')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <Card className="max-w-4xl mx-auto mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Identity Verification</h2>
                  <button
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const response = await fetch('/api/kyc/refresh-token', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' }
                        })
                        if (response.ok) {
                          const { token } = await response.json()
                          window.location.href = `/kyc/verify?token=${token}`
                        }
                      } catch (err) {
                        console.error('Failed to refresh token:', err)
                      }
                      setLoading(false)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Having issues? Click here to refresh
                  </button>
                </div>
              </CardContent>
            </Card>
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-4">
                <SumSubLauncher 
                  token={sumsubToken}
                  onComplete={handleKycComplete}
                  onError={handleKycError}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

export default function KycVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <KycVerifyPageContent />
    </Suspense>
  )
}