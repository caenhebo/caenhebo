'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { SumSubLauncher } from '@/components/kyc/sumsub-launcher'
import Header from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, AlertCircle } from 'lucide-react'

function Kyc2VerifyPageContent() {
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
    const token = searchParams.get('token') || session.user.kyc2SessionId
    if (token) {
      setSumsubToken(token)
      setLoading(false)
    } else {
      setError('No verification token found')
      setLoading(false)
    }
  }, [session, status, searchParams, router])

  const handleKycComplete = async () => {
    // Update session to reflect KYC2 submission
    await update()
    // Redirect to KYC2 callback page
    router.push('/kyc2/callback')
  }

  const handleKycError = async (error: any) => {
    console.error('KYC2 error:', error)

    // If token error, try to get a fresh one
    if (error?.message?.includes('token') || error?.code === 'TOKEN_EXPIRED') {
      setError('Session expired. Getting a new verification session...')
      try {
        const response = await fetch('/api/kyc/refresh-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tier: 2 })
        })

        if (response.ok) {
          const { token } = await response.json()
          // Reload page with new token
          window.location.href = `/kyc2/verify?token=${token}`
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
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <Card className="max-w-4xl mx-auto mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">KYC Tier 2 Verification</h2>
                  </div>
                  <Badge variant="secondary">Enhanced Due Diligence</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Please complete the following questionnaire and provide any additional documents requested.
                  This enhanced verification is required for higher transaction limits.
                </p>
              </CardContent>
            </Card>

            <div className="max-w-4xl mx-auto">
              <SumSubLauncher
                token={sumsubToken}
                onComplete={handleKycComplete}
                onError={handleKycError}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Kyc2VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <Kyc2VerifyPageContent />
    </Suspense>
  )
}