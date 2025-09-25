'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Clock, Home, ArrowLeft } from 'lucide-react'
import Header from '@/components/header'

export default function Kyc2CallbackPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Update session to get latest KYC2 status
    update()
  }, [update])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">
              KYC Tier 2 Verification Submitted
            </CardTitle>
            <CardDescription className="text-center">
              Your enhanced verification is being reviewed
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Successfully submitted!</strong> Your Tier 2 verification documents have been received and are now being reviewed by our compliance team.
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">What happens next?</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Our compliance team will review your documents and questionnaire (typically 1-2 business days)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>You'll receive an email notification once the review is complete</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>If approved, you'll have unlimited transaction limits immediately</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>If additional information is needed, we'll contact you via email</span>
                </li>
              </ul>
            </div>

            <div className="border-t pt-6">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  You can continue using your account within Tier 1 limits while we review your Tier 2 verification.
                </p>

                <div className="flex justify-center gap-3">
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="min-w-[140px]"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.push('/kyc2')}
                    className="min-w-[140px]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Check Status
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              <p>
                Verification ID: {session?.user?.kyc2SessionId || 'Loading...'}
              </p>
              <p className="mt-1">
                If you have any questions, please contact our support team.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}