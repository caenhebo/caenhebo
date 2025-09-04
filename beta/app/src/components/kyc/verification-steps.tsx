'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'

interface VerificationStepsProps {
  onComplete: () => void
  strigaUserId?: string
  initialStep?: 'email' | 'mobile'
}

export function VerificationSteps({ onComplete, strigaUserId, initialStep = 'email' }: VerificationStepsProps) {
  const [step, setStep] = useState<'email' | 'mobile' | 'complete'>(initialStep)
  const [emailCode, setEmailCode] = useState('')
  const [mobileCode, setMobileCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const verifyEmail = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/kyc/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: emailCode || '123456' // Default for sandbox
        })
      })
      
      if (!response.ok) {
        throw new Error('Email verification failed')
      }
      
      setStep('mobile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const verifyMobile = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/kyc/verify-mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: mobileCode || '123456' // Default for sandbox
        })
      })
      
      if (!response.ok) {
        throw new Error('Mobile verification failed')
      }
      
      setStep('complete')
      // Wait a moment before proceeding
      setTimeout(onComplete, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step === 'email' || step === 'mobile' || step === 'complete' 
              ? 'bg-primary text-white' 
              : 'bg-gray-200'
          }`}>
            {step === 'mobile' || step === 'complete' ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
          </div>
          <span className="ml-2 text-sm font-medium">Email Verification</span>
        </div>
        
        <div className="w-16 h-px bg-gray-300" />
        
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step === 'mobile' || step === 'complete' 
              ? 'bg-primary text-white' 
              : 'bg-gray-200'
          }`}>
            {step === 'complete' ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
          </div>
          <span className="ml-2 text-sm font-medium">Mobile Verification</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email Verification */}
      {step === 'email' && (
        <Card>
          <CardHeader>
            <CardTitle>Email Already Verified ✓</CardTitle>
            <CardDescription>
              Your email has already been verified. Proceeding to mobile verification...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">Email verification complete</p>
              <Button 
                onClick={() => setStep('mobile')} 
                className="w-full mt-4"
              >
                Continue to Mobile Verification
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Verification */}
      {step === 'mobile' && (
        <Card>
          <CardHeader>
            <CardTitle>Verify Your Mobile Number</CardTitle>
            <CardDescription>
              We've sent a verification code to your mobile number. 
              In the sandbox environment, use code: <strong>123456</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mobileCode">Verification Code</Label>
                <Input
                  id="mobileCode"
                  placeholder="Enter 6-digit code"
                  value={mobileCode}
                  onChange={(e) => setMobileCode(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button 
                onClick={verifyMobile} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Mobile'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion */}
      {step === 'complete' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Verification Complete!</h3>
              <p className="text-gray-600">
                Your email and mobile number have been verified. Proceeding to identity verification...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}