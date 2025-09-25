'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
  FileCheck
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface Kyc2VerificationProps {
  transactionId: string
  role: 'buyer' | 'seller'
  onComplete?: () => void
}

interface Kyc2Status {
  userKycStatus: string
  userKyc2Status: string
  documentTypes: string[]
  requiredDocuments: {
    id: string
    name: string
    description: string
    uploaded: boolean
    verified: boolean
    uploadedAt?: string
  }[]
  canStartKyc2: boolean
  kycSessionId?: string
}

export function Kyc2Verification({ transactionId, role, onComplete }: Kyc2VerificationProps) {
  const [status, setStatus] = useState<Kyc2Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startingKyc, setStartingKyc] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    fetchKyc2Status()
  }, [transactionId])

  const fetchKyc2Status = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/transactions/${transactionId}/kyc2-status`)

      if (!response.ok) {
        throw new Error('Failed to fetch KYC2 status')
      }

      const data = await response.json()
      setStatus(data)
    } catch (err) {
      console.error('Error fetching KYC2 status:', err)
      setError(err instanceof Error ? err.message : 'Failed to load KYC2 status')
    } finally {
      setLoading(false)
    }
  }

  const startKyc2Verification = async () => {
    try {
      setStartingKyc(true)
      setError(null)

      // For now, redirect to the standalone KYC2 page
      // The transaction context will be preserved through the session
      window.location.href = '/kyc2'

    } catch (err) {
      console.error('Error starting KYC2:', err)
      setError(err instanceof Error ? err.message : 'Failed to start KYC2 verification')
      setStartingKyc(false)
    }
  }

  // Mock complete KYC2 for testing
  const completeKyc2 = async () => {
    try {
      setCompleting(true)
      setError(null)

      const response = await fetch(`/api/transactions/${transactionId}/complete-kyc2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to complete KYC2 verification')
      }

      const data = await response.json()

      // Show success and refresh
      if (onComplete) {
        onComplete()
      }

      await fetchKyc2Status()
    } catch (err) {
      console.error('Error completing KYC2:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete KYC2 verification')
    } finally {
      setCompleting(false)
    }
  }

  const getRequiredDocuments = () => {
    return [
      {
        id: 'proof_of_funds',
        name: 'Proof of Funds',
        description: 'Bank statements showing source of funds for the last 3 months',
        icon: <CreditCard className="h-5 w-5" />
      },
      {
        id: 'employment_proof',
        name: 'Employment Verification',
        description: 'Employment contract or letter from employer',
        icon: <Building className="h-5 w-5" />
      },
      {
        id: 'tax_returns',
        name: 'Tax Returns',
        description: 'Tax returns or tax certificate for the last year',
        icon: <FileText className="h-5 w-5" />
      },
      {
        id: 'additional_id',
        name: 'Additional ID',
        description: 'Secondary form of identification (passport or driving license)',
        icon: <User className="h-5 w-5" />
      }
    ]
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const requiredDocs = getRequiredDocuments()
  const uploadedCount = status?.requiredDocuments?.filter(d => d.uploaded).length || 0
  const progress = (uploadedCount / requiredDocs.length) * 100

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle>KYC Tier 2 Verification</CardTitle>
          </div>
          <Badge variant={
            status?.userKyc2Status === 'PASSED' ? 'success' :
            status?.userKyc2Status === 'INITIATED' ? 'secondary' :
            status?.userKyc2Status === 'REJECTED' ? 'destructive' :
            'outline'
          }>
            {status?.userKyc2Status === 'PASSED' ? 'Verified' :
             status?.userKyc2Status === 'INITIATED' ? 'In Review' :
             status?.userKyc2Status === 'REJECTED' ? 'Rejected' :
             'Not Started'}
          </Badge>
        </div>
        <CardDescription>
          Enhanced verification is required for fund protection. Please provide the following documents to complete your KYC Tier 2 verification.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Indicator */}
        {status?.userKyc2Status === 'PENDING' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Documents Uploaded</span>
              <span>{uploadedCount} of {requiredDocs.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Status Messages */}
        {status?.userKyc2Status === 'PASSED' && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Your KYC Tier 2 verification has been approved. You can now proceed with fund protection.
            </AlertDescription>
          </Alert>
        )}

        {status?.userKyc2Status === 'INITIATED' && (
          <Alert>
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              Your documents are being reviewed. This typically takes 1-2 business days.
            </AlertDescription>
          </Alert>
        )}

        {status?.userKyc2Status === 'REJECTED' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Your KYC Tier 2 verification was rejected. Please contact support for more information.
            </AlertDescription>
          </Alert>
        )}

        {/* Required Documents List */}
        {status?.userKyc2Status !== 'PASSED' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Required Documents</h3>
            <div className="grid gap-3">
              {requiredDocs.map((doc) => {
                const statusDoc = status?.requiredDocuments?.find(d => d.id === doc.id)
                const isUploaded = statusDoc?.uploaded || false
                const isVerified = statusDoc?.verified || false

                return (
                  <div
                    key={doc.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isVerified ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : isUploaded ? (
                        <FileCheck className="h-5 w-5 text-blue-600" />
                      ) : (
                        doc.icon
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.description}</p>
                      {isUploaded && (
                        <Badge variant="secondary" className="text-xs">
                          Uploaded {statusDoc?.uploadedAt ? new Date(statusDoc.uploadedAt).toLocaleDateString() : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Action Button */}
        {status?.canStartKyc2 && status?.userKyc2Status === 'PENDING' && (
          <div className="pt-4">
            <Button
              onClick={startKyc2Verification}
              disabled={startingKyc}
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
                  Start KYC Tier 2 Verification
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              You will be redirected to our verification partner to upload your documents securely.
            </p>
          </div>
        )}

        {!status?.canStartKyc2 && status?.userKyc2Status === 'PENDING' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please ensure you have completed KYC Tier 1 verification before proceeding with Tier 2.
            </AlertDescription>
          </Alert>
        )}

        {/* Mock Complete Button for Testing */}
        <div className="border-t pt-4 mt-4">
          <Button
            className="w-full"
            variant="outline"
            size="lg"
            onClick={completeKyc2}
            disabled={completing}
          >
            {completing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing KYC2...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete KYC2 Verification (Test)
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Click here to simulate successful KYC2 completion for testing purposes.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}