'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Download,
  CheckCircle,
  Loader2,
  AlertCircle,
  Signature,
  Upload,
  FileCheck,
  X,
  HandHelping,
  Shield
} from 'lucide-react'

interface RepresentationMediationProps {
  transactionId: string
  userRole: 'buyer' | 'seller'
  hasRepresentation: boolean
  hasMediationSigned: boolean
  buyerMediationSigned: boolean
  sellerMediationSigned: boolean
  agreedPrice: string
  propertyTitle: string
  propertyCode: string
  onComplete?: () => void
}

const formatPrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR'
  }).format(numPrice)
}

export default function RepresentationMediation({
  transactionId,
  userRole,
  hasRepresentation,
  hasMediationSigned,
  buyerMediationSigned,
  sellerMediationSigned,
  agreedPrice,
  propertyTitle,
  propertyCode,
  onComplete
}: RepresentationMediationProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [agreedMediation, setAgreedMediation] = useState(false)
  const [agreedRepresentation, setAgreedRepresentation] = useState(false)
  const [uploadedRepFile, setUploadedRepFile] = useState<File | null>(null)
  const [uploadedMedFile, setUploadedMedFile] = useState<File | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  // Local state for tracking signatures
  const [localBuyerSigned, setLocalBuyerSigned] = useState(buyerMediationSigned)
  const [localSellerSigned, setLocalSellerSigned] = useState(sellerMediationSigned)
  const [localHasRepresentation, setLocalHasRepresentation] = useState(hasRepresentation)
  const [localHasMediationSigned, setLocalHasMediationSigned] = useState(hasMediationSigned)

  const hasSigned = userRole === 'buyer' ? localBuyerSigned : localSellerSigned
  const otherPartySigned = userRole === 'buyer' ? localSellerSigned : localBuyerSigned
  const bothSigned = localBuyerSigned && localSellerSigned
  const bothDocumentsReady = localHasRepresentation && localHasMediationSigned

  const handleRepresentationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      setError('Please upload a PDF or image file of the representation document')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setError(null)
    setUploadedRepFile(file)
  }

  const handleMediationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      setError('Please upload a PDF or image file of the signed mediation agreement')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setError(null)
    setUploadedMedFile(file)
  }

  const handleDownloadMediation = async () => {
    // Generate a simple mediation agreement template
    const content = `MEDIATION AGREEMENT

Property: ${propertyTitle} (${propertyCode})
Agreed Price: ${formatPrice(agreedPrice)}
Date: ${new Date().toLocaleDateString()}

PARTIES:
Buyer: _________________________
Seller: _________________________

MEDIATION TERMS:

1. DISPUTE RESOLUTION
Both parties agree to resolve any disputes through mediation before pursuing legal action.

2. MEDIATOR SELECTION
A neutral mediator will be selected mutually by both parties or appointed by Caenhebo.

3. MEDIATION COSTS
Mediation costs will be shared equally between both parties.

4. BINDING AGREEMENT
The outcome of successful mediation will be binding on both parties.

5. GOOD FAITH
Both parties agree to participate in mediation in good faith.

6. CONFIDENTIALITY
All mediation proceedings will remain confidential.

SIGNATURES:

Buyer Signature: _________________________
Date: _________________________

Seller Signature: _________________________
Date: _________________________

This agreement is subject to Portuguese law and jurisdiction.`;

    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mediation-agreement-${propertyCode}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleUploadRepresentation = async () => {
    if (!uploadedRepFile) {
      setError('Please select a representation document to upload')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadedRepFile)
      formData.append('type', 'REPRESENTATION_DOCUMENT')

      const response = await fetch(`/api/transactions/${transactionId}/documents/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload representation document')
      }

      setSuccess('✅ Representation document uploaded successfully!')
      setLocalHasRepresentation(true)
      setUploadedRepFile(null)

      // Clear file input
      const fileInput = document.getElementById('rep-file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err) {
      console.error('Error uploading representation:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload representation document')
    } finally {
      setUploading(false)
    }
  }

  const handleSignMediation = async () => {
    if (!agreedMediation) {
      setError('Please agree to the mediation terms')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/transactions/${transactionId}/sign-mediation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: userRole
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to sign mediation agreement')
      }

      const data = await response.json()

      // Update the signature states based on API response
      if (data.buyerSigned) setLocalBuyerSigned(true)
      if (data.sellerSigned) setLocalSellerSigned(true)
      if (data.bothSigned) setLocalHasMediationSigned(true)

      // Check if both documents are ready
      if (data.bothSigned && localHasRepresentation) {
        setSuccess('🎉 Both documents completed! Moving to the next stage...')
        setTransitioning(true)

        // Trigger completion callback with shorter delay
        if (onComplete) {
          setTimeout(() => {
            onComplete()
          }, 500)
        }
      } else if (data.bothSigned) {
        setSuccess('✅ Mediation agreement signed by both parties! Upload representation document to continue.')
      } else {
        setSuccess('✅ You have successfully signed the mediation agreement! Waiting for the other party...')
      }

      setAgreedMediation(false)
    } catch (err) {
      console.error('Error signing mediation agreement:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign mediation agreement')
    } finally {
      setLoading(false)
    }
  }

  // Show completed state
  if (bothDocumentsReady && !transitioning) {
    return (
      <Card className="border-2 border-green-400">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-xl flex items-center text-green-700">
            <CheckCircle className="mr-3 h-6 w-6" />
            Legal Documentation Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center text-green-700">
              <CheckCircle className="mr-2 h-5 w-5" />
              <span>Representation Document Uploaded</span>
            </div>
            <div className="flex items-center text-green-700">
              <CheckCircle className="mr-2 h-5 w-5" />
              <span>Mediation Agreement Signed by Both Parties</span>
            </div>
            <Alert className="border-green-400 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                All legal documentation is complete. You can now proceed to KYC Tier 2 Verification.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card className={`border-2 border-purple-400 ${transitioning ? 'opacity-75' : ''}`}>
      <CardHeader className="bg-purple-50">
        <CardTitle className="text-xl flex items-center">
          <Shield className="mr-3 h-6 w-6 text-purple-600" />
          Legal Documentation & Mediation Agreement
        </CardTitle>
        <CardDescription>
          Complete representation document and mediation agreement for {propertyTitle}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 relative">
        {/* Transitioning overlay */}
        {transitioning && (
          <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center rounded-lg">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <p className="text-lg font-semibold text-gray-800">Moving to KYC Tier 2...</p>
            <p className="text-sm text-gray-600 mt-2">Please wait a moment</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-400 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Status Overview */}
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Documentation Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Representation Document:</span>
                <span className={localHasRepresentation ? "text-green-600 font-medium" : "text-orange-500"}>
                  {localHasRepresentation ? "✓ Uploaded" : "⏳ Required"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mediation Agreement (Buyer):</span>
                <span className={localBuyerSigned ? "text-green-600 font-medium" : "text-gray-500"}>
                  {localBuyerSigned ? "✓ Signed" : "⏳ Pending"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mediation Agreement (Seller):</span>
                <span className={localSellerSigned ? "text-green-600 font-medium" : "text-gray-500"}>
                  {localSellerSigned ? "✓ Signed" : "⏳ Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Part 1: Representation Document */}
        <div className="mb-6 border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
          <h4 className="font-semibold mb-3 flex items-center">
            <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
              1
            </span>
            Representation Document
          </h4>

          {localHasRepresentation ? (
            <Alert className="border-green-400 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Representation document has been uploaded successfully.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Upload the legal representation document that authorizes Caenhebo to facilitate this transaction.
              </p>

              <div className="space-y-3">
                <Input
                  id="rep-file-upload"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleRepresentationUpload}
                  disabled={uploading}
                />

                {uploadedRepFile && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="text-sm">{uploadedRepFile.name}</span>
                    <Button
                      size="sm"
                      onClick={handleUploadRepresentation}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Part 2: Mediation Agreement */}
        <div className="mb-6 border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
          <h4 className="font-semibold mb-3 flex items-center">
            <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
              2
            </span>
            Mediation Agreement
          </h4>

          {bothSigned ? (
            <Alert className="border-green-400 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Mediation agreement has been signed by both parties.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Button
                variant="outline"
                size="lg"
                className="w-full mb-3"
                onClick={handleDownloadMediation}
              >
                <Download className="mr-2 h-5 w-5" />
                Download Mediation Agreement Template
              </Button>

              <p className="text-sm text-gray-600 mb-3">
                Download, review, and agree to the mediation terms for dispute resolution.
              </p>

              {!hasSigned && (
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="agree-mediation"
                      checked={agreedMediation}
                      onCheckedChange={(checked) => setAgreedMediation(checked as boolean)}
                    />
                    <label htmlFor="agree-mediation" className="text-sm">
                      I have read and agree to the mediation terms. I understand that any disputes
                      will first be resolved through mediation before legal proceedings.
                    </label>
                  </div>

                  <Button
                    onClick={handleSignMediation}
                    disabled={!agreedMediation || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      <>
                        <Signature className="mr-2 h-4 w-4" />
                        Sign Mediation Agreement
                      </>
                    )}
                  </Button>
                </div>
              )}

              {hasSigned && !bothSigned && (
                <Alert className="border-blue-400 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    You have signed. Waiting for the other party to sign the mediation agreement.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        {/* Instructions */}
        <Alert className="border-purple-400 bg-purple-50">
          <HandHelping className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-700">
            Both the representation document and mediation agreement must be completed before
            proceeding to KYC Tier 2 Verification.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
    </>
  )
}