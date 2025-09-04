'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface SumSubLauncherProps {
  token: string
  onComplete?: () => void
  onError?: (error: any) => void
}

// Declare the global snsWebSdk as shown in Striga docs
declare global {
  interface Window {
    snsWebSdk: any
  }
}

export function SumSubLauncher({ token, onComplete, onError }: SumSubLauncherProps) {
  const [verificationComplete, setVerificationComplete] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  const handleGoToDashboard = () => {
    const dashboardUrl = session?.user.role === 'BUYER' ? '/buyer/dashboard' : '/seller/dashboard'
    router.push(dashboardUrl)
  }

  useEffect(() => {
    // Load the SumSub SDK script
    const script = document.createElement('script')
    script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js'
    script.async = true
    
    script.onload = () => {
      console.log('[SumSub] Script loaded, checking for snsWebSdk...')
      
      // The Striga docs show it as 'snsWebSdk' not 'SumsubWebSdk'
      if (window.snsWebSdk) {
        console.log('[SumSub] Found snsWebSdk, launching...')
        launchSumSubWebSdk(token)
      } else {
        console.error('[SumSub] snsWebSdk not found on window')
        onError?.({ message: 'SumSub SDK not loaded' })
      }
    }
    
    script.onerror = () => {
      console.error('[SumSub] Failed to load script')
      onError?.({ message: 'Failed to load SumSub SDK' })
    }
    
    document.body.appendChild(script)
    
    // Function from Striga documentation
    function launchSumSubWebSdk(token: string) {
      try {
        let snsWebSdkInstance = window.snsWebSdk.init(
          token,
          // updateAccessToken callback - required by SumSub
          () => {
            console.log('[SumSub] Access token update requested')
            // Return the same token or fetch a new one if needed
            return Promise.resolve(token)
          }
        )
          .withConf({
            lang: 'en',
            onMessage: (type: string, payload: any) => {
              console.log('WebSDK onMessage', type, payload)
              
              // Handle different message types
              if (type === 'idCheck.onApplicantSubmitted') {
                // Application submitted successfully
                setVerificationComplete(true)
                onComplete?.()
              } else if (type === 'idCheck.onApplicantReady') {
                // Applicant is ready (all steps completed)
                setVerificationComplete(true)
              } else if (type === 'idCheck.onComplete') {
                // Verification process completed
                setVerificationComplete(true)
              }
            },
          })
          .build()
          
        snsWebSdkInstance.launch('#sumsub-websdk-container')
      } catch (error) {
        console.error('[SumSub] Failed to launch:', error)
        onError?.(error)
      }
    }
    
    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [token, onComplete, onError])
  
  if (verificationComplete) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-4">Your profile has been verified!</h2>
        <p className="text-gray-600 mb-8 text-lg">
          Thank you for completing the verification process. Your identity is being reviewed.
        </p>
        <Button 
          onClick={handleGoToDashboard}
          size="lg"
          className="px-8"
        >
          Go to your dashboard
        </Button>
      </div>
    )
  }
  
  return (
    <div id="sumsub-websdk-container" style={{ width: '100%', minHeight: '600px' }}>
      <p style={{ textAlign: 'center', padding: '20px' }}>Loading verification...</p>
    </div>
  )
}