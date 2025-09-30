'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield,
  Scale,
  Users,
  HandshakeIcon,
  Info,
  Download
} from 'lucide-react'

interface MediationStatus {
  signed: boolean
  signedAt: string | null
  canSign: boolean
  kyc2Status: string
}

export default function MediationAgreementPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [mediationStatus, setMediationStatus] = useState<MediationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [understood, setUnderstood] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (sessionStatus === 'authenticated') {
      fetchMediationStatus()
    }
  }, [sessionStatus, router])

  const fetchMediationStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/sign-mediation')

      if (!response.ok) {
        throw new Error('Failed to fetch mediation status')
      }

      const data = await response.json()
      setMediationStatus(data)

      // If already signed, redirect based on role
      if (data.signed && session?.user?.role) {
        router.push(session.user.role === 'SELLER' ? '/seller/dashboard' : '/buyer/dashboard')
      }
    } catch (err) {
      console.error('Error fetching mediation status:', err)
      setError(err instanceof Error ? err.message : 'Failed to load mediation status')
    } finally {
      setLoading(false)
    }
  }

  const handleSignAgreement = async () => {
    if (!agreed || !understood) {
      setError('Please read and accept all terms before signing')
      return
    }

    try {
      setSigning(true)
      setError(null)

      const response = await fetch('/api/user/sign-mediation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to sign agreement')
      }

      const data = await response.json()

      // Show success message then redirect
      setMediationStatus({
        signed: true,
        signedAt: data.signedAt,
        canSign: false,
        kyc2Status: mediationStatus?.kyc2Status || 'PASSED'
      })

      // Redirect after a short delay
      setTimeout(() => {
        if (session?.user?.role === 'SELLER') {
          router.push('/seller/dashboard')
        } else {
          router.push('/buyer/dashboard')
        }
      }, 2000)

    } catch (err) {
      console.error('Error signing agreement:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign agreement')
    } finally {
      setSigning(false)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10
    setScrolledToBottom(isAtBottom)
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (mediationStatus?.kyc2Status !== 'PASSED') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
                KYC Tier 2 Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You must complete KYC Tier 2 verification before signing the mediation agreement.
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button onClick={() => router.push('/kyc2')} className="w-full">
                  Complete KYC Tier 2
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (mediationStatus?.signed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-center">Agreement Already Signed</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  You have already signed the mediation agreement on{' '}
                  {mediationStatus.signedAt && new Date(mediationStatus.signedAt).toLocaleDateString()}.
                  Redirecting to your dashboard...
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Main Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mediation Agreement</h1>
          <p className="text-gray-600">
            {session?.user?.role === 'SELLER'
              ? 'Required to receive offers on your properties'
              : 'Required to make offers on properties'
            }
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Why This Agreement Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5 text-blue-600" />
              Why This Agreement?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start">
                <Scale className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Fair Dispute Resolution</h4>
                  <p className="text-sm text-gray-600">
                    Provides a structured process for resolving any disputes that may arise during property transactions.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Protection for All Parties</h4>
                  <p className="text-sm text-gray-600">
                    Ensures both buyers and sellers have access to impartial mediation if needed.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Users className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Professional Standards</h4>
                  <p className="text-sm text-gray-600">
                    Maintains high standards of professionalism in all property transactions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agreement Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Mediation Agreement Terms
            </CardTitle>
            <CardDescription>
              Please read the following agreement carefully before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="h-[400px] w-full rounded-md border p-4 overflow-y-auto"
              onScroll={handleScroll}
            >
              <div className="space-y-4 text-sm">
                <h3 className="font-bold text-lg">MEDIATION AGREEMENT</h3>

                <p className="text-gray-600">
                  This Mediation Agreement ("Agreement") is entered into by and between the users of the
                  Caenhebo platform ("Parties") for the purpose of establishing a framework for dispute
                  resolution in property transactions.
                </p>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">1. SCOPE OF MEDIATION</h4>
                  <p className="text-gray-600 mb-2">
                    The Parties agree that any dispute, controversy, or claim arising out of or relating to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 space-y-1">
                    <li>Property listings and descriptions</li>
                    <li>Offer and acceptance procedures</li>
                    <li>Counter-offers and negotiations</li>
                    <li>Payment terms and conditions</li>
                    <li>Property condition and disclosures</li>
                    <li>Transaction timelines and deadlines</li>
                  </ul>
                  <p className="text-gray-600 mt-2">
                    shall first be submitted to mediation before pursuing any other remedy.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">2. MEDIATION PROCESS</h4>
                  <ul className="list-disc pl-6 text-gray-600 space-y-1">
                    <li>Mediation shall be initiated by either party providing written notice to the other party</li>
                    <li>The mediator shall be selected by mutual agreement or appointed by Caenhebo</li>
                    <li>Mediation shall take place online or at a mutually agreed location</li>
                    <li>Each party shall bear their own costs and equally share the mediator's fees</li>
                    <li>The mediation process shall be confidential</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">3. GOOD FAITH PARTICIPATION</h4>
                  <p className="text-gray-600">
                    The Parties agree to participate in the mediation process in good faith and to make
                    reasonable efforts to resolve disputes. This includes:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
                    <li>Providing relevant information and documentation</li>
                    <li>Attending mediation sessions as scheduled</li>
                    <li>Considering proposed solutions with an open mind</li>
                    <li>Maintaining confidentiality of the mediation process</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">4. TIMELINE</h4>
                  <p className="text-gray-600">
                    Mediation must be initiated within 30 days of a dispute arising and should be
                    completed within 60 days unless extended by mutual agreement.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">5. BINDING NATURE</h4>
                  <p className="text-gray-600">
                    While the mediation process itself is non-binding, any settlement agreement reached
                    through mediation shall be binding and enforceable.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">6. PRESERVATION OF RIGHTS</h4>
                  <p className="text-gray-600">
                    If mediation does not result in a settlement within the specified timeframe, the
                    Parties preserve all rights to pursue other legal remedies.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">7. COSTS</h4>
                  <p className="text-gray-600">
                    Unless otherwise agreed:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
                    <li>Each party bears their own attorney fees and costs</li>
                    <li>Mediator fees are shared equally between parties</li>
                    <li>Venue costs, if any, are shared equally</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">8. CONFIDENTIALITY</h4>
                  <p className="text-gray-600">
                    All mediation proceedings, including statements, documents, and settlement discussions,
                    shall remain strictly confidential and may not be used as evidence in any subsequent
                    legal proceedings.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">9. PLATFORM INTEGRATION</h4>
                  <p className="text-gray-600">
                    By signing this agreement, you acknowledge that:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
                    <li>This agreement is required to make or receive offers on Caenhebo</li>
                    <li>Caenhebo may facilitate the mediation process</li>
                    <li>Dispute resolution is a prerequisite to platform transactions</li>
                  </ul>
                </div>

                <Separator />

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">
                    By signing this agreement, you confirm that you have read, understood, and agree
                    to be bound by these mediation terms. This agreement shall remain in effect for
                    all transactions conducted through the Caenhebo platform.
                  </p>
                </div>

                {/* Scroll indicator */}
                {!scrolledToBottom && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      ↓ Scroll down to read the complete agreement ↓
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4 mt-6">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="understood"
                  checked={understood}
                  onCheckedChange={(checked) => setUnderstood(checked as boolean)}
                  disabled={!scrolledToBottom}
                />
                <label
                  htmlFor="understood"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I have read and understood the mediation agreement terms
                  {!scrolledToBottom && (
                    <span className="text-xs text-gray-500 block mt-1">
                      (Please scroll to the bottom of the agreement first)
                    </span>
                  )}
                </label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreed"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  disabled={!understood}
                />
                <label
                  htmlFor="agreed"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to resolve disputes through mediation before pursuing other legal remedies
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleSignAgreement}
              disabled={!agreed || !understood || signing}
              size="lg"
              className="w-full"
            >
              {signing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing Agreement...
                </>
              ) : (
                <>
                  <HandshakeIcon className="mr-2 h-4 w-4" />
                  Sign Mediation Agreement
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              By signing, you agree to use mediation for dispute resolution in all Caenhebo transactions.
              This enables you to {session?.user?.role === 'SELLER' ? 'receive' : 'make'} offers on properties.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}