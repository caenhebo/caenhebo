'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { 
  Upload,
  CheckCircle,
  Loader2,
  ArrowDown,
  HandHelping,
  Clock
} from 'lucide-react'

interface Stage3SimpleProps {
  transactionId: string
  userRole: 'buyer' | 'seller' | 'admin'
  userId: string
  onStageComplete?: () => void
}

export default function Stage3Simple({ 
  transactionId, 
  userRole, 
  userId,
  onStageComplete 
}: Stage3SimpleProps) {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [stage3Status, setStage3Status] = useState({
    hasRepresentationDoc: false,
    hasMediationAgreement: false,
    buyerConfirmed: false,
    sellerConfirmed: false,
    mediationSigned: false,
    stage3Complete: false,
    canAdvanceToEscrow: false
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch Stage 3 status
  const fetchStage3Status = async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/stage3`)
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch Stage 3 status'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If JSON parsing fails, use default message
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      if (data.status) {
        setStage3Status({
          hasRepresentationDoc: data.status.hasRepresentationDoc || false,
          hasMediationAgreement: data.status.hasMediationAgreement || false,
          buyerConfirmed: data.status.buyerConfirmed || false,
          sellerConfirmed: data.status.sellerConfirmed || false,
          mediationSigned: data.status.mediationSigned || false,
          stage3Complete: data.status.stage3Complete || false,
          canAdvanceToEscrow: data.status.canAdvanceToEscrow || false
        })
      }
    } catch (err) {
      console.error('Error fetching Stage 3 status:', err)
      setError(err instanceof Error ? err.message : 'Failed to load Stage 3 status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStage3Status()
    // Refresh every 5 seconds to check if other party has acted
    const interval = setInterval(fetchStage3Status, 5000)
    return () => clearInterval(interval)
  }, [transactionId])

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', docType)
      formData.append('title', docType === 'REPRESENTATION_DOCUMENT' 
        ? 'Legal Representation Document' 
        : 'Mediation Agreement')
      
      const response = await fetch(`/api/transactions/${transactionId}/documents/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      setSuccess('✅ Document uploaded successfully!')
      await fetchStage3Status()
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setProcessing(false)
    }
  }

  // Handle confirmation
  const handleAction = async (action: string) => {
    setProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/transactions/${transactionId}/stage3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Action failed')
      }

      setSuccess('✅ Action completed successfully!')
      await fetchStage3Status()

      if (stage3Status.stage3Complete && onStageComplete) {
        setTimeout(() => onStageComplete(), 2000)
      }
    } catch (err) {
      console.error('Action error:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete action')
    } finally {
      setProcessing(false)
    }
  }

  // Determine what the user needs to do next
  const getNextAction = () => {
    if (userRole === 'buyer') {
      if (!stage3Status.hasRepresentationDoc) {
        return {
          title: "📄 Upload Your Legal Representation Document",
          description: "You need to upload a PDF document that proves you have legal representation",
          action: "upload_rep",
          buttonText: "Click Here to Upload Document",
          isFile: true
        }
      }
      if (!stage3Status.buyerConfirmed) {
        return {
          title: "✍️ Confirm Your Legal Representation",
          description: "Click the button below to confirm you have legal representation",
          action: "CONFIRM_REPRESENTATION",
          buttonText: "Yes, I Confirm I Have Legal Representation",
          isFile: false
        }
      }
      if (!stage3Status.hasMediationAgreement) {
        return {
          title: "📋 Upload Mediation Agreement",
          description: "Upload the mediation agreement document (PDF format)",
          action: "upload_med",
          buttonText: "Click Here to Upload Mediation Agreement",
          isFile: true
        }
      }
      if (!stage3Status.mediationSigned) {
        return {
          title: "✅ Sign the Mediation Agreement",
          description: "Click below to digitally sign the mediation agreement",
          action: "SIGN_MEDIATION",
          buttonText: "I Agree - Sign Mediation Agreement",
          isFile: false
        }
      }
      if (!stage3Status.sellerConfirmed) {
        return {
          title: "⏳ Waiting for Seller",
          description: "The seller needs to confirm their legal representation. We'll notify you when they do.",
          action: "wait",
          buttonText: "",
          isFile: false
        }
      }
    } else if (userRole === 'seller') {
      // First check if buyer has uploaded docs AND confirmed
      if (!stage3Status.hasRepresentationDoc || !stage3Status.hasMediationAgreement || !stage3Status.buyerConfirmed) {
        return {
          title: "⏳ Waiting for Buyer to Complete Their Part",
          description: "The buyer must complete the following first:\n• Upload their legal representation document\n• Upload the mediation agreement\n• Confirm they have legal representation\n\nOnce they complete these steps, you'll be able to confirm your legal representation.",
          action: "wait",
          buttonText: "",
          isFile: false
        }
      }
      // Then seller can confirm
      if (!stage3Status.sellerConfirmed) {
        return {
          title: "✍️ Confirm Your Legal Representation",
          description: "Click the button below to confirm you have legal representation",
          action: "CONFIRM_REPRESENTATION",
          buttonText: "Yes, I Confirm I Have Legal Representation",
          isFile: false
        }
      }
      // Then wait for buyer to sign mediation
      if (!stage3Status.mediationSigned) {
        return {
          title: "⏳ Waiting for Buyer to Sign",
          description: "The buyer needs to sign the mediation agreement. We'll notify you when complete.",
          action: "wait",
          buttonText: "",
          isFile: false
        }
      }
    }

    // All done!
    return {
      title: "🎉 Stage 3 Complete!",
      description: "All requirements have been met. You can now proceed to the Escrow stage.",
      action: "complete",
      buttonText: "Continue to Escrow Stage →",
      isFile: false
    }
  }

  if (loading) {
    return (
      <Card className="border-2 border-blue-400">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg">Loading your requirements...</p>
        </CardContent>
      </Card>
    )
  }

  const nextAction = getNextAction()

  return (
    <div className="space-y-6">
      {/* Main Action Card - THIS IS THE ONLY THING THAT MATTERS */}
      <Card className="border-4 border-blue-500 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 pb-8">
          <CardTitle className="text-3xl text-center">
            Stage 3: Legal Requirements
          </CardTitle>
        </CardHeader>

        <CardContent className="py-8">
          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription className="text-lg">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6 border-green-400 bg-green-50">
              <AlertDescription className="text-lg text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* What You Need To Do Section */}
          <div className="bg-yellow-50 border-4 border-yellow-300 rounded-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <HandHelping className="h-16 w-16 text-yellow-600" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              What You Need To Do Now:
            </h2>
            
            <p className="text-xl mb-8 text-gray-700">
              {nextAction.title}
            </p>
            
            <p className="text-lg mb-8 text-gray-600">
              {nextAction.description}
            </p>

            {/* Big Arrow Pointing Down */}
            {nextAction.action !== 'wait' && nextAction.action !== 'complete' && (
              <div className="flex justify-center mb-6 animate-bounce">
                <ArrowDown className="h-12 w-12 text-blue-600" />
              </div>
            )}

            {/* THE ONE AND ONLY ACTION BUTTON */}
            {nextAction.action === 'wait' ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="inline-flex items-center px-8 py-4 bg-gray-100 rounded-lg">
                    <Clock className="h-8 w-8 text-gray-500 mr-3 animate-pulse" />
                    <span className="text-xl text-gray-600">Waiting for the other party...</span>
                  </div>
                </div>
                
                {/* Show progress for sellers waiting */}
                {userRole === 'seller' && (
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mt-6 text-left">
                    <h3 className="font-semibold text-gray-700 mb-3">Buyer's Progress:</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        {stage3Status.hasRepresentationDoc ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400 mr-2" />
                        )}
                        <span className={stage3Status.hasRepresentationDoc ? "text-green-700" : "text-gray-500"}>
                          Legal representation document
                        </span>
                      </div>
                      <div className="flex items-center">
                        {stage3Status.hasMediationAgreement ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400 mr-2" />
                        )}
                        <span className={stage3Status.hasMediationAgreement ? "text-green-700" : "text-gray-500"}>
                          Mediation agreement document
                        </span>
                      </div>
                      <div className="flex items-center">
                        {stage3Status.buyerConfirmed ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400 mr-2" />
                        )}
                        <span className={stage3Status.buyerConfirmed ? "text-green-700" : "text-gray-500"}>
                          Representation confirmation
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : nextAction.action === 'complete' ? (
              <Button 
                size="lg"
                className="w-full max-w-md mx-auto h-20 text-xl bg-green-600 hover:bg-green-700"
                onClick={() => onStageComplete && onStageComplete()}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-3 h-8 w-8" />
                    {nextAction.buttonText}
                  </>
                )}
              </Button>
            ) : nextAction.isFile ? (
              <div className="flex justify-center">
                <label htmlFor={`file-upload-${nextAction.action}`}>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e, 
                      nextAction.action === 'upload_rep' ? 'REPRESENTATION_DOCUMENT' : 'MEDIATION_AGREEMENT'
                    )}
                    disabled={processing}
                    className="hidden"
                    id={`file-upload-${nextAction.action}`}
                  />
                  <Button 
                    size="lg"
                    className="h-20 px-12 text-xl bg-blue-600 hover:bg-blue-700"
                    disabled={processing}
                    asChild
                  >
                    <span className="cursor-pointer">
                      {processing ? (
                        <>
                          <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-3 h-8 w-8" />
                          {nextAction.buttonText}
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            ) : (
              <Button 
                size="lg"
                className="w-full max-w-md mx-auto h-20 text-xl bg-blue-600 hover:bg-blue-700"
                onClick={() => handleAction(nextAction.action)}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-3 h-8 w-8" />
                    {nextAction.buttonText}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Progress Checklist (Small, for reference only) */}
          <div className="mt-8 pt-8 border-t-2 border-gray-200">
            <p className="text-sm text-gray-500 mb-3">Progress Checklist:</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center">
                {stage3Status.hasRepresentationDoc ? 
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> : 
                  <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2" />
                }
                <span>Representation Document</span>
              </div>
              <div className="flex items-center">
                {stage3Status.buyerConfirmed ? 
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> : 
                  <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2" />
                }
                <span>Buyer Confirmed</span>
              </div>
              <div className="flex items-center">
                {stage3Status.hasMediationAgreement ? 
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> : 
                  <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2" />
                }
                <span>Mediation Agreement</span>
              </div>
              <div className="flex items-center">
                {stage3Status.sellerConfirmed ? 
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> : 
                  <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2" />
                }
                <span>Seller Confirmed</span>
              </div>
              <div className="flex items-center">
                {stage3Status.mediationSigned ? 
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> : 
                  <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2" />
                }
                <span>Agreement Signed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}