'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Header from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Clock, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

function KycCallbackPageContent() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [kycStatus, setKycStatus] = useState<'checking' | 'pending' | 'approved' | 'rejected'>('checking')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // Check KYC status
    checkKycStatus()
  }, [session, status])

  const checkKycStatus = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true)
        console.log('[KYC Callback] Force syncing with Striga...')
        
        // Force sync with Striga when user manually checks
        const syncResponse = await fetch('/api/kyc/sync', {
          method: 'POST'
        })
        
        if (syncResponse.ok) {
          const syncData = await syncResponse.json()
          console.log('[KYC Callback] Sync result:', syncData)
        }
      }
      console.log('[KYC Callback] Checking KYC status...')
      
      const response = await fetch('/api/kyc/status')
      if (response.ok) {
        const data = await response.json()
        
        console.log('[KYC Callback] Status response:', data)
        
        // Map status to display state with proper status names
        if (data.kycStatus === 'PASSED') {
          setKycStatus('approved')  // Display as "Approved" for user
        } else if (data.kycStatus === 'REJECTED') {
          setKycStatus('rejected')
        } else if (data.kycStatus === 'INITIATED') {
          setKycStatus('pending')   // Still being reviewed
        } else {
          setKycStatus('pending')   // Default to pending for other states
        }
        
        // Update session to reflect new KYC status
        await update()
      } else {
        console.error('[KYC Callback] Failed to fetch status:', response.status)
        setKycStatus('pending')
      }
    } catch (error) {
      console.error('[KYC Callback] Failed to check KYC status:', error)
      setKycStatus('pending')
    } finally {
      if (showRefreshing) setIsRefreshing(false)
    }
  }
  
  const handleRefresh = () => {
    checkKycStatus(true)
  }

  const handleContinue = () => {
    const dashboardUrl = session?.user.role === 'BUYER' ? '/buyer/dashboard' : '/seller/dashboard'
    router.push(dashboardUrl)
  }

  if (status === 'loading' || kycStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="pt-6">
            {kycStatus === 'approved' && (
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">KYC Verification Approved!</h2>
                <p className="text-gray-600 mb-6">
                  Your identity has been successfully verified. You can now access all platform features.
                </p>
                <Button onClick={handleContinue} size="lg">
                  Continue to Dashboard
                </Button>
              </div>
            )}

            {kycStatus === 'pending' && (
              <div className="text-center">
                <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">KYC Verification Pending Approval</h2>
                <p className="text-gray-600 mb-6">
                  Your identity verification is being reviewed. This usually takes a few minutes but can take up to 24 hours.
                  We'll notify you once the review is complete.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={handleRefresh} variant="outline" size="lg" disabled={isRefreshing}>
                    {isRefreshing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Check Status
                      </>
                    )}
                  </Button>
                  <Button onClick={handleContinue} size="lg">
                    Continue to Dashboard
                  </Button>
                </div>
              </div>
            )}

            {kycStatus === 'rejected' && (
              <div className="text-center">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">KYC Verification Rejected</h2>
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>
                    We're sorry, but your identity verification was not successful. 
                    Please contact <a href="mailto:kyc@caenhebo.com" className="underline font-medium">kyc@caenhebo.com</a> to get more information on how we can work together.
                  </AlertDescription>
                </Alert>
                <Button onClick={handleContinue} variant="outline" size="lg">
                  Back to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function KycCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <KycCallbackPageContent />
    </Suspense>
  )
}