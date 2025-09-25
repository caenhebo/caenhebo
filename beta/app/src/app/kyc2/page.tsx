'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Shield,
  CheckCircle,
  XCircle,
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  User,
  CreditCard,
  Building,
  FileCheck,
  ArrowLeft,
  ClipboardCheck,
  Home,
  Info,
  ExternalLink
} from 'lucide-react'

interface Kyc2Status {
  userId: string
  kycStatus: string
  kyc2Status: string
  kyc2SessionId?: string
  kyc2CompletedAt?: string
  canStartKyc2: boolean
  documentsRequired: {
    type: string
    name: string
    description: string
    required: boolean
  }[]
  sourceOfFundsOptions: string[]
  estimatedTime: string
  currentTier: number
  limitsInfo: {
    tier1: {
      crypto: string
      total: string
    }
    tier2: {
      crypto: string
      total: string
    }
  }
}

export default function Kyc2Page() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [kycStatus, setKycStatus] = useState<Kyc2Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startingKyc, setStartingKyc] = useState(false)

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (sessionStatus === 'authenticated') {
      fetchKyc2Status()
    }
  }, [sessionStatus, router])

  const fetchKyc2Status = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/kyc/status')

      if (!response.ok) {
        throw new Error('Failed to fetch KYC status')
      }

      const data = await response.json()

      // Transform the response to our expected format
      setKycStatus({
        userId: data.userId || session?.user?.id || '',
        kycStatus: data.kycStatus || 'PENDING',
        kyc2Status: data.kyc2Status || 'PENDING',
        kyc2SessionId: data.kyc2SessionId,
        kyc2CompletedAt: data.kyc2CompletedAt,
        canStartKyc2: data.kycStatus === 'PASSED' && data.kyc2Status !== 'PASSED',
        documentsRequired: [
          {
            type: 'source_of_funds',
            name: 'Source of Funds Questionnaire',
            description: 'Explain the origin of your funds for this transaction',
            required: true
          },
          {
            type: 'proof_of_address',
            name: 'Proof of Address',
            description: 'Utility bill or bank statement from the last 3 months',
            required: !data.proofOfAddressCollected
          },
          {
            type: 'employment_proof',
            name: 'Employment Verification',
            description: 'Employment contract or payslips from the last 3 months',
            required: false
          },
          {
            type: 'tax_returns',
            name: 'Tax Returns',
            description: 'Tax returns or tax certificate for the last year',
            required: false
          }
        ].filter(doc => doc.required || data.kyc2Status === 'PENDING'),
        sourceOfFundsOptions: [
          'Personal Savings',
          'Labor Contract / Salary',
          'Sale of Property',
          'Business Income',
          'Investment Returns',
          'Inheritance',
          'Gift from Family',
          'Other'
        ],
        estimatedTime: '10-15 minutes',
        currentTier: data.kycStatus === 'PASSED' ? 1 : 0,
        limitsInfo: {
          tier1: {
            crypto: '€15,000',
            total: '€25,000'
          },
          tier2: {
            crypto: 'Unlimited',
            total: 'Unlimited'
          }
        }
      })
    } catch (err) {
      console.error('Error fetching KYC2 status:', err)
      setError(err instanceof Error ? err.message : 'Failed to load KYC status')
    } finally {
      setLoading(false)
    }
  }

  const startKyc2Verification = async () => {
    try {
      setStartingKyc(true)
      setError(null)

      const response = await fetch('/api/kyc/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tier: 2 })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start KYC2 verification')
      }

      const data = await response.json()

      // If we got a KYC URL, redirect to it
      if (data.kycUrl) {
        window.location.href = data.kycUrl
      } else if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No verification URL received')
      }
    } catch (err) {
      console.error('Error starting KYC2:', err)
      setError(err instanceof Error ? err.message : 'Failed to start KYC2 verification')
      setStartingKyc(false)
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED': return 'success'
      case 'INITIATED': return 'secondary'
      case 'REJECTED': return 'destructive'
      case 'EXPIRED': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PASSED': return 'Verified'
      case 'INITIATED': return 'In Review'
      case 'REJECTED': return 'Rejected'
      case 'EXPIRED': return 'Expired'
      default: return 'Not Started'
    }
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
          <h1 className="text-3xl font-bold mb-2">KYC Tier 2 Verification</h1>
          <p className="text-gray-600">Enhanced verification for higher transaction limits</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <CardTitle>Verification Status</CardTitle>
              </div>
              <div className="flex gap-2">
                <Badge variant={getStatusColor(kycStatus?.kycStatus || '')}>
                  Tier 1: {getStatusText(kycStatus?.kycStatus || '')}
                </Badge>
                <Badge variant={getStatusColor(kycStatus?.kyc2Status || '')}>
                  Tier 2: {getStatusText(kycStatus?.kyc2Status || '')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {kycStatus?.kyc2Status === 'PASSED' ? (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Your Tier 2 verification is complete! You now have unlimited transaction limits.
                  {kycStatus.kyc2CompletedAt && (
                    <span className="block text-xs mt-1">
                      Completed on {new Date(kycStatus.kyc2CompletedAt).toLocaleDateString()}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ) : kycStatus?.kyc2Status === 'INITIATED' ? (
              <Alert>
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  Your documents are being reviewed. This typically takes 1-2 business days.
                  You'll receive an email notification once the review is complete.
                </AlertDescription>
              </Alert>
            ) : kycStatus?.kyc2Status === 'REJECTED' ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Your Tier 2 verification was rejected. Please contact support for assistance or try again with updated documents.
                </AlertDescription>
              </Alert>
            ) : kycStatus?.kycStatus !== 'PASSED' ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You must complete Tier 1 verification before proceeding with Tier 2.
                  <Button
                    variant="link"
                    className="p-0 h-auto ml-2"
                    onClick={() => router.push('/kyc')}
                  >
                    Complete Tier 1 →
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Why complete Tier 2 verification?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Unlimited transaction limits (currently limited to €25,000)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Access to fund protection for large property transactions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Enhanced security and compliance for your account</span>
                    </li>
                  </ul>
                </div>

                <p className="text-sm text-gray-600">
                  Estimated time: <strong>{kycStatus?.estimatedTime}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Limits Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Transaction Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg border ${kycStatus?.currentTier === 1 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                <h4 className="font-semibold mb-2">Tier 1 {kycStatus?.currentTier === 1 && '(Current)'}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Crypto Limit:</span>
                    <span className="font-medium">{kycStatus?.limitsInfo.tier1.crypto}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Limit:</span>
                    <span className="font-medium">{kycStatus?.limitsInfo.tier1.total}</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${kycStatus?.kyc2Status === 'PASSED' ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                <h4 className="font-semibold mb-2">Tier 2 {kycStatus?.kyc2Status === 'PASSED' && '(Current)'}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Crypto Limit:</span>
                    <span className="font-medium">{kycStatus?.limitsInfo.tier2.crypto}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Limit:</span>
                    <span className="font-medium">{kycStatus?.limitsInfo.tier2.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Required Documents Card */}
        {kycStatus?.kyc2Status === 'PENDING' && kycStatus?.canStartKyc2 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Required for Tier 2
              </CardTitle>
              <CardDescription>
                You'll need to provide the following information during verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Source of Funds */}
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <ClipboardCheck className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">Source of Funds Questionnaire</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        You'll be asked to explain where your funds come from
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {kycStatus.sourceOfFundsOptions.slice(0, 4).map((option) => (
                          <Badge key={option} variant="secondary" className="text-xs">
                            {option}
                          </Badge>
                        ))}
                        <Badge variant="outline" className="text-xs">
                          +{kycStatus.sourceOfFundsOptions.length - 4} more
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Documents */}
                {kycStatus.documentsRequired
                  .filter(doc => doc.type !== 'source_of_funds')
                  .map((doc) => (
                    <div key={doc.type} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start gap-3">
                        <FileCheck className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">
                            {doc.name}
                            {!doc.required && (
                              <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {doc.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Button */}
        {kycStatus?.canStartKyc2 && kycStatus?.kyc2Status === 'PENDING' && (
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={startKyc2Verification}
                disabled={startingKyc}
                size="lg"
                className="w-full"
              >
                {startingKyc ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Verification...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Start Tier 2 Verification
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                You will be redirected to our secure verification partner (SumSub) to complete the process.
                The verification typically takes 10-15 minutes to complete.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Already in progress */}
        {kycStatus?.kyc2Status === 'INITIATED' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Verification in Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Your documents are being reviewed by our compliance team.
                    We'll notify you by email once the review is complete.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed */}
        {kycStatus?.kyc2Status === 'PASSED' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Verification Complete!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You now have unlimited transaction limits and can proceed with large property transactions.
                  </p>
                  <Button onClick={() => router.push('/dashboard')}>
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}