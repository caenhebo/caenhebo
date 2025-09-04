'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { KycForm, KycFormData } from '@/components/kyc/kyc-form'
import { VerificationSteps } from '@/components/kyc/verification-steps'
import { StepIndicator } from '@/components/kyc/step-indicator'
import Header from '@/components/header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function KycPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stage, setStage] = useState<'loading' | 'form' | 'verification' | 'preparing' | 'redirect'>('loading')
  const [error, setError] = useState('')
  const [strigaUserId, setStrigaUserId] = useState('')
  const [formData, setFormData] = useState<KycFormData | null>(null)
  const [verificationStep, setVerificationStep] = useState<'email' | 'mobile'>('email')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // Check current KYC status to determine stage
    checkKycStatus()
  }, [session, status])

  const checkKycStatus = async () => {
    try {
      // First check if user exists in Striga
      const strigaResponse = await fetch('/api/kyc/check-striga-user')
      if (!strigaResponse.ok) {
        setStage('form')
        return
      }
      
      const strigaData = await strigaResponse.json()
      console.log('[KYC Page] Striga user data:', strigaData)
      
      // Then get local status
      const response = await fetch('/api/kyc/status')
      if (!response.ok) {
        setStage('form')
        return
      }
      
      const data = await response.json()
      
      // Set strigaUserId if available
      if (data.strigaUserId || strigaData.strigaUserId) {
        setStrigaUserId(data.strigaUserId || strigaData.strigaUserId)
      }
      
      // Set form data if available
      if (data.formData) {
        setFormData(data.formData)
      }
      
      // Determine stage based on Striga verification status
      if (!strigaData.exists || !data.strigaUserId) {
        setStage('form')
      } else if (!strigaData.emailVerified) {
        setStage('verification')
        setVerificationStep('email')
      } else if (!strigaData.mobileVerified) {
        // Email is verified, now need mobile
        setStage('verification')
        setVerificationStep('mobile')
      } else if (strigaData.kycStatus === 'APPROVED' || data.kycStatus === 'PASSED') {
        // Already completed - redirect
        router.push(session?.user.role === 'BUYER' ? '/buyer/dashboard' : '/seller/dashboard')
      } else if (strigaData.kycStatus === 'IN_REVIEW' || strigaData.kycStatus === 'INITIATED' || data.kycStatus === 'INITIATED') {
        // KYC in progress - check if we have existing session
        console.log('[KYC Page] KYC already initiated')
        if (data.kycSessionId) {
          // Use existing session
          console.log('[KYC Page] Using existing session:', data.kycSessionId)
          const kycUrl = `/kyc/verify?token=${data.kycSessionId}`
          window.location.href = kycUrl
        } else {
          // Get new session from Striga
          fetchKycSession()
        }
      } else {
        // Ready to start KYC - both email and mobile verified
        // Auto-start the KYC session since verifications are complete
        console.log('[KYC Page] Both email and mobile verified, starting KYC session')
        fetchKycSession()
      }
    } catch (error) {
      console.error('Failed to check KYC status:', error)
      setStage('form')
    }
  }

  const fetchKycSession = async () => {
    try {
      setStage('preparing')
      
      // Get existing KYC session
      const response = await fetch('/api/kyc/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          strigaUserId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get KYC session')
      }

      const { kycUrl } = await response.json()
      
      // Redirect to KYC verification
      setStage('redirect')
      window.location.href = kycUrl
    } catch (error) {
      console.error('[KYC Page] Failed to fetch session:', error)
      setError(error instanceof Error ? error.message : 'Failed to continue KYC verification')
      setStage('form')
    }
  }

  const handleKycSubmit = async (data: KycFormData) => {
    try {
      setStage('preparing')
      setFormData(data) // Save form data
      
      // Submit KYC data to create Striga user
      const response = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to initiate KYC')
      }

      const result = await response.json()
      setStrigaUserId(result.strigaUserId)
      
      // Move to verification stage (email and mobile verification)
      setStage('verification')
      setError('') // Clear any previous errors
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start KYC process')
      setStage('form')
    }
  }

  const handleVerificationComplete = async () => {
    try {
      setStage('preparing')
      
      // Now start the actual KYC process with Striga
      const response = await fetch('/api/kyc/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          strigaUserId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start KYC verification')
      }

      const { kycUrl } = await response.json()
      
      // Redirect to KYC verification
      setStage('redirect')
      window.location.href = kycUrl
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start identity verification')
      setStage('verification') // Stay on verification stage, not form
    }
  }

  if (status === 'loading' || stage === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  // Calculate current step number
  const getCurrentStep = (): 1 | 2 | 3 | 4 => {
    if (stage === 'form') return 1
    if (stage === 'verification' && verificationStep === 'email') return 2
    if (stage === 'verification' && verificationStep === 'mobile') return 3
    return 4
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Indicator */}
        {stage !== 'loading' && (
          <StepIndicator currentStep={getCurrentStep()} />
        )}
        {stage === 'form' && (
          <>
            {error && (
              <Alert variant="destructive" className="max-w-2xl mx-auto mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <KycForm
              onSubmit={handleKycSubmit}
              initialData={formData || {
                firstName: session.user.name?.split(' ')[0] || '',
                lastName: session.user.name?.split(' ')[1] || '',
                email: session.user.email || ''
              }}
            />
          </>
        )}

        {stage === 'verification' && (
          <>
            {error && (
              <Alert variant="destructive" className="max-w-2xl mx-auto mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <VerificationSteps 
              onComplete={handleVerificationComplete}
              strigaUserId={strigaUserId}
              initialStep={verificationStep}
            />
          </>
        )}

        {stage === 'preparing' && (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-semibold mb-2">We are preparing your verification</h2>
                <p className="text-gray-600">Creating your account and preparing verification...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === 'redirect' && (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-semibold mb-2">Redirecting to verification</h2>
                <p className="text-gray-600">You will be redirected to complete your identity verification...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}