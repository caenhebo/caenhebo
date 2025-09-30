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
  X
} from 'lucide-react'

interface PromissoryAgreementProps {
  transactionId: string
  userRole: 'buyer' | 'seller'
  buyerSigned: boolean
  sellerSigned: boolean
  agreedPrice: string
  propertyTitle: string
  propertyCode: string
  advancePaymentPercentage?: number
  onComplete?: () => void
}

const formatPrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR'
  }).format(numPrice)
}

export default function PromissoryAgreement({
  transactionId,
  userRole,
  buyerSigned,
  sellerSigned,
  agreedPrice,
  propertyTitle,
  propertyCode,
  advancePaymentPercentage = 0,
  onComplete
}: PromissoryAgreementProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  // Local state for tracking signatures
  const [localBuyerSigned, setLocalBuyerSigned] = useState(buyerSigned)
  const [localSellerSigned, setLocalSellerSigned] = useState(sellerSigned)

  const hasSigned = userRole === 'buyer' ? localBuyerSigned : localSellerSigned
  const otherPartySigned = userRole === 'buyer' ? localSellerSigned : localBuyerSigned
  const bothSigned = localBuyerSigned && localSellerSigned

  // Determine document type based on advance payment
  const isPromissoryNote = advancePaymentPercentage > 0
  const documentType = isPromissoryNote ? 'Promissory Note' : 'Purchase & Sale Agreement'
  const documentDescription = isPromissoryNote
    ? `Promissory note confirming advance payment of ${advancePaymentPercentage}% for ${propertyTitle}`
    : `Legal agreement confirming the terms of sale for ${propertyTitle}`

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      setError('Please upload a PDF or image file of the signed agreement')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setUploadedFile(file)
    setError(null)
    setSuccess(`✅ Uploaded: ${file.name}`)
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setSuccess(null)
    // Reset file input
    const fileInput = document.getElementById('agreement-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleDownloadAgreement = async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/agreement-pdf`)
      
      if (response.ok) {
        const html = await response.text()
        const blob = new Blob([html], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `promissory-agreement-${propertyCode}.html`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error('Failed to generate agreement')
      }
    } catch (err) {
      console.error('Error downloading agreement:', err)
      setError('Failed to download agreement')
    }
  }

  const handleSignClick = () => {
    if (!agreed) {
      setError('You must read and agree to the terms first')
      return
    }

    if (!uploadedFile) {
      setError('Please upload the signed agreement PDF first')
      return
    }

    // Show confirmation dialog
    setShowConfirmDialog(true)
  }

  const handleSignAgreement = async () => {
    setShowConfirmDialog(false)
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/transactions/${transactionId}/sign-promissory`, {
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
        throw new Error(data.error || 'Failed to sign agreement')
      }

      const data = await response.json()

      // Update the signature states based on API response
      if (data.buyerSigned) setLocalBuyerSigned(true)
      if (data.sellerSigned) setLocalSellerSigned(true)

      // Check if both parties have now signed
      if (data.bothSigned) {
        setSuccess(`🎉 Both parties have signed the ${documentType}! Moving to the next stage...`)
        setTransitioning(true)

        // If auto-advanced, reload immediately
        if (data.autoAdvanced && data.newStatus) {
          setTimeout(() => {
            window.location.reload()
          }, 500)
        } else if (onComplete) {
          // Trigger completion callback with shorter delay
          setTimeout(() => {
            onComplete()
          }, 500)
        }
      } else {
        setSuccess('✅ You have successfully signed! Waiting for the other party to sign...')
      }

      // Clear the agreement checkbox to prevent re-signing
      setAgreed(false)
    } catch (err) {
      console.error('Error signing agreement:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign agreement')
    } finally {
      setLoading(false)
    }
  }

  if (bothSigned) {
    return (
      <Card className="border-2 border-green-400">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-xl flex items-center">
            <CheckCircle className="mr-3 h-6 w-6 text-green-600" />
            {documentType} Signed
          </CardTitle>
          <CardDescription>
            Both parties have signed the {documentType}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center px-6 py-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">Agreement fully executed</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                onClick={() => window.location.reload()}
              >
                Continue with the Process
              </Button>

              <Button
                variant="outline"
                onClick={handleDownloadAgreement}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Signed Agreement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card className={`border-2 border-blue-400 ${transitioning ? 'opacity-75' : ''}`}>
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-xl flex items-center">
          <FileText className="mr-3 h-6 w-6 text-blue-600" />
          {documentType}
        </CardTitle>
        <CardDescription>
          {documentDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 relative">
        {/* Transitioning overlay */}
        {transitioning && (
          <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center rounded-lg">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg font-semibold text-gray-800">Moving to next stage...</p>
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
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Agreement Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Agreement Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Property:</span>
                <span className="font-medium">{propertyTitle} ({propertyCode})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Agreed Purchase Price:</span>
                <span className="font-bold text-lg">€{agreedPrice}</span>
              </div>
              {isPromissoryNote && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Advance Payment:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {advancePaymentPercentage}% (€{(parseFloat(agreedPrice) * advancePaymentPercentage / 100).toFixed(2)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining at Closing:</span>
                    <span className="font-medium">
                      {100 - advancePaymentPercentage}% (€{(parseFloat(agreedPrice) * (100 - advancePaymentPercentage) / 100).toFixed(2)})
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Buyer Status:</span>
                <span className={buyerSigned ? "text-green-600 font-medium" : "text-gray-500"}>
                  {buyerSigned ? "✓ Signed" : "⏳ Pending signature"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seller Status:</span>
                <span className={sellerSigned ? "text-green-600 font-medium" : "text-gray-500"}>
                  {sellerSigned ? "✓ Signed" : "⏳ Pending signature"}
                </span>
              </div>
            </div>
          </div>

          {/* Step 1: Download Agreement */}
          <div className="mb-6 border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <h4 className="font-semibold mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                1
              </span>
              Download Agreement Template
            </h4>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleDownloadAgreement}
            >
              <Download className="mr-2 h-5 w-5" />
              Download Agreement to Review
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              Download, print, sign it physically or digitally, then upload the signed version
            </p>
          </div>

          {/* Step 2: Upload Signed Agreement */}
          <div className="mb-6 border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <h4 className="font-semibold mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                2
              </span>
              Upload Your Signed Agreement
            </h4>

            {uploadedFile ? (
              <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
                <div className="flex items-center">
                  <FileCheck className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    {uploadedFile.name}
                  </span>
                  <span className="text-xs text-green-600 ml-2">
                    ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Input
                  id="agreement-upload"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="agreement-upload">
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer"
                    size="lg"
                    asChild
                  >
                    <span>
                      <Upload className="mr-2 h-5 w-5" />
                      Select Signed Agreement (PDF or Image)
                    </span>
                  </Button>
                </label>
                <p className="text-sm text-gray-600 mt-2">
                  Upload the agreement after you have signed it
                </p>
              </div>
            )}
          </div>

          {/* Step 3: Sign Agreement - Hide during loading to prevent double-clicking */}
          {!hasSigned && !loading && (
            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
              <h4 className="font-semibold mb-3 flex items-center">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                  3
                </span>
                Confirm and Sign the Agreement
              </h4>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    By signing this agreement, you confirm that you have read, understood, and agree to all terms 
                    and conditions outlined in the {documentType}.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 mb-6">
                <Checkbox 
                  id="agree"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                />
                <label 
                  htmlFor="agree" 
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I have read and agree to the terms and conditions of the {documentType}. 
                  I understand this is a legally binding document.
                </label>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleSignClick}
                disabled={loading || !agreed || !uploadedFile}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing Agreement...
                  </>
                ) : (
                  <>
                    <Signature className="mr-2 h-5 w-5" />
                    Sign {documentType} as {userRole === 'buyer' ? 'Buyer' : 'Seller'}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Loading state while processing signature */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center px-6 py-3 bg-blue-100 rounded-lg">
                <Loader2 className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
                <span className="text-blue-800">
                  Processing your signature...
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Please wait, do not refresh the page
              </p>
            </div>
          )}

          {/* Waiting for Other Party */}
          {hasSigned && !otherPartySigned && !loading && (
            <div className="text-center">
              <div className="inline-flex items-center px-6 py-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800">
                  ✅ You have signed. Waiting for {userRole === 'buyer' ? 'seller' : 'buyer'} to sign...
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Confirmation Dialog */}
    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
            Confirm Digital Signature
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-4">
            <p>You are about to digitally sign the following document:</p>

            <div className="bg-gray-50 rounded-lg p-3 border">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-600 mr-2" />
                <div>
                  <p className="font-medium text-gray-900">{uploadedFile?.name}</p>
                  <p className="text-xs text-gray-500">
                    Size: {uploadedFile && (uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Legal Notice:</strong> By clicking "Confirm and Sign", you are
                electronically signing this agreement, which is legally binding.
              </p>
            </div>

            <p className="text-sm">
              Property: <strong>{propertyTitle}</strong><br />
              Agreement Price: <strong>{formatPrice(agreedPrice)}</strong>
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setShowConfirmDialog(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSignAgreement}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Signature className="mr-2 h-4 w-4" />
            Confirm and Sign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}