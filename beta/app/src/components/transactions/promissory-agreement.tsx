'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText,
  Download,
  CheckCircle,
  Loader2,
  AlertCircle,
  Signature
} from 'lucide-react'

interface PromissoryAgreementProps {
  transactionId: string
  userRole: 'buyer' | 'seller'
  buyerSigned: boolean
  sellerSigned: boolean
  agreedPrice: string
  propertyTitle: string
  propertyCode: string
  onComplete?: () => void
}

export default function PromissoryAgreement({ 
  transactionId,
  userRole,
  buyerSigned,
  sellerSigned,
  agreedPrice,
  propertyTitle,
  propertyCode,
  onComplete
}: PromissoryAgreementProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)

  const hasSigned = userRole === 'buyer' ? buyerSigned : sellerSigned
  const otherPartySigned = userRole === 'buyer' ? sellerSigned : buyerSigned
  const bothSigned = buyerSigned && sellerSigned

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

  const handleSignAgreement = async () => {
    if (!agreed) {
      setError('You must read and agree to the terms first')
      return
    }

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

      setSuccess('✅ You have successfully signed the Promissory Purchase & Sale Agreement!')
      
      // Check if both parties have now signed
      if (otherPartySigned) {
        setSuccess('🎉 Both parties have signed! You can now proceed to the next stage.')
        if (onComplete) {
          setTimeout(() => onComplete(), 2000)
        }
      }
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
            Promissory Agreement Signed
          </CardTitle>
          <CardDescription>
            Both parties have signed the Promissory Purchase & Sale Agreement
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center px-6 py-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">Agreement fully executed</span>
            </div>
            
            <div className="flex justify-center">
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
    <Card className="border-2 border-blue-400">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-xl flex items-center">
          <FileText className="mr-3 h-6 w-6 text-blue-600" />
          Promissory Purchase & Sale Agreement
        </CardTitle>
        <CardDescription>
          Legal agreement confirming the terms of sale for {propertyTitle}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
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

          {/* Download Agreement */}
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleDownloadAgreement}
              className="w-full"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Agreement to Review
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              Please download and carefully review the agreement before signing
            </p>
          </div>

          {/* Sign Agreement Section */}
          {!hasSigned && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Sign the Agreement</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    By signing this agreement, you confirm that you have read, understood, and agree to all terms 
                    and conditions outlined in the Promissory Purchase & Sale Agreement.
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
                  I have read and agree to the terms and conditions of the Promissory Purchase & Sale Agreement. 
                  I understand this is a legally binding document.
                </label>
              </div>

              <Button 
                size="lg"
                className="w-full"
                onClick={handleSignAgreement}
                disabled={loading || !agreed}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing Agreement...
                  </>
                ) : (
                  <>
                    <Signature className="mr-2 h-5 w-5" />
                    Sign Promissory Agreement as {userRole === 'buyer' ? 'Buyer' : 'Seller'}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Waiting for Other Party */}
          {hasSigned && !otherPartySigned && (
            <div className="text-center">
              <div className="inline-flex items-center px-6 py-3 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800">
                  You have signed. Waiting for {userRole === 'buyer' ? 'seller' : 'buyer'} to sign...
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}