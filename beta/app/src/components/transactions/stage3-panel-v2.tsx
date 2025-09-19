'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { 
  FileText,
  Upload,
  CheckCircle,
  Circle,
  AlertCircle,
  Loader2,
  Users,
  FileCheck,
  ArrowRight,
  Info
} from 'lucide-react'

interface Stage3PanelProps {
  transactionId: string
  userRole: 'buyer' | 'seller' | 'admin'
  userId: string
  onStageComplete?: () => void
}

interface Step {
  id: string
  title: string
  description: string
  action: string
  completed: boolean
  current: boolean
  canAct: boolean
  requiresFile?: boolean
}

export default function Stage3PanelV2({ 
  transactionId, 
  userRole, 
  userId,
  onStageComplete 
}: Stage3PanelProps) {
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
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

  // Calculate progress
  const getProgress = () => {
    let completed = 0
    const total = 5 // Total requirements
    
    if (stage3Status.hasRepresentationDoc) completed++
    if (stage3Status.hasMediationAgreement) completed++
    if (stage3Status.buyerConfirmed) completed++
    if (stage3Status.sellerConfirmed) completed++
    if (stage3Status.mediationSigned) completed++
    
    return (completed / total) * 100
  }

  // Define steps based on user role
  const getSteps = (): Step[] => {
    if (userRole === 'buyer') {
      return [
        {
          id: 'rep-doc',
          title: 'Upload Representation Document',
          description: 'Upload your legal representation document (PDF format)',
          action: 'upload_rep',
          completed: stage3Status.hasRepresentationDoc,
          current: !stage3Status.hasRepresentationDoc,
          canAct: true,
          requiresFile: true
        },
        {
          id: 'confirm-rep',
          title: 'Confirm Your Representation',
          description: 'Confirm that you have legal representation for this transaction',
          action: 'confirm_rep',
          completed: stage3Status.buyerConfirmed,
          current: stage3Status.hasRepresentationDoc && !stage3Status.buyerConfirmed,
          canAct: stage3Status.hasRepresentationDoc
        },
        {
          id: 'med-agreement',
          title: 'Upload Mediation Agreement',
          description: 'Upload the signed mediation agreement (PDF format)',
          action: 'upload_med',
          completed: stage3Status.hasMediationAgreement,
          current: stage3Status.buyerConfirmed && !stage3Status.hasMediationAgreement,
          canAct: stage3Status.buyerConfirmed,
          requiresFile: true
        },
        {
          id: 'sign-med',
          title: 'Sign Mediation Agreement',
          description: 'Digitally sign the mediation agreement',
          action: 'sign_med',
          completed: stage3Status.mediationSigned,
          current: stage3Status.hasMediationAgreement && !stage3Status.mediationSigned,
          canAct: stage3Status.hasMediationAgreement
        },
        {
          id: 'wait-seller',
          title: 'Waiting for Seller',
          description: 'Seller needs to confirm their representation',
          action: 'none',
          completed: stage3Status.sellerConfirmed,
          current: stage3Status.mediationSigned && !stage3Status.sellerConfirmed,
          canAct: false
        }
      ]
    } else if (userRole === 'seller') {
      return [
        {
          id: 'wait-buyer-doc',
          title: 'Waiting for Buyer Documents',
          description: 'Buyer needs to upload representation and mediation documents',
          action: 'none',
          completed: stage3Status.hasRepresentationDoc && stage3Status.hasMediationAgreement,
          current: !stage3Status.hasRepresentationDoc || !stage3Status.hasMediationAgreement,
          canAct: false
        },
        {
          id: 'confirm-rep',
          title: 'Confirm Your Representation',
          description: 'Confirm that you have legal representation for this transaction',
          action: 'confirm_rep',
          completed: stage3Status.sellerConfirmed,
          current: stage3Status.hasRepresentationDoc && !stage3Status.sellerConfirmed,
          canAct: stage3Status.hasRepresentationDoc
        },
        {
          id: 'review-med',
          title: 'Review Mediation Agreement',
          description: 'The mediation agreement has been uploaded by the buyer',
          action: 'none',
          completed: stage3Status.mediationSigned,
          current: stage3Status.sellerConfirmed && !stage3Status.mediationSigned,
          canAct: false
        }
      ]
    } else {
      // Admin view
      return [
        {
          id: 'overview',
          title: 'Stage 3 Overview',
          description: 'Monitor the completion of representation and mediation requirements',
          action: 'none',
          completed: stage3Status.stage3Complete,
          current: !stage3Status.stage3Complete,
          canAct: false
        }
      ]
    }
  }

  const steps = getSteps()
  const currentStepIndex = steps.findIndex(s => s.current) !== -1 
    ? steps.findIndex(s => s.current) 
    : steps.length - 1

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
        setStage3Status(data.status)
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
  }, [transactionId])

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
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

      setSuccess(`Document uploaded successfully!`)
      await fetchStage3Status() // Refresh status
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  // Handle confirmation action
  const handleConfirmation = async (action: string) => {
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

      const data = await response.json()
      setSuccess('Confirmation completed successfully!')
      await fetchStage3Status() // Refresh status

      if (data.stage3Complete && onStageComplete) {
        onStageComplete()
      }
    } catch (err) {
      console.error('Confirmation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to confirm')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Stage Card */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <Users className="mr-3 h-6 w-6" />
                Stage 3: Representation & Mediation
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Both parties must confirm legal representation and sign the mediation agreement
              </CardDescription>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {Math.round(getProgress())}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
          <Progress value={getProgress()} className="mt-4 h-3" />
        </CardHeader>

        <CardContent className="pt-6">
          {/* Status Messages */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Steps Progress */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className={`
                border rounded-lg p-4 transition-all
                ${step.current ? 'border-blue-400 bg-blue-50 shadow-md' : 
                  step.completed ? 'border-green-200 bg-green-50' : 
                  'border-gray-200 bg-gray-50'}
              `}>
                <div className="flex items-start space-x-4">
                  {/* Step Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {step.completed ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : step.current ? (
                      <Circle className="h-6 w-6 text-blue-600 animate-pulse" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-semibold text-lg ${
                          step.completed ? 'text-green-700' : 
                          step.current ? 'text-blue-700' : 'text-gray-600'
                        }`}>
                          Step {index + 1}: {step.title}
                        </h4>
                        <p className={`mt-1 ${
                          step.current ? 'text-gray-700' : 'text-gray-600'
                        }`}>
                          {step.description}
                        </p>
                      </div>

                      {/* Action Button */}
                      {step.current && step.canAct && (
                        <div>
                          {step.requiresFile ? (
                            <div className="relative">
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileUpload(e, 
                                  step.action === 'upload_rep' ? 'REPRESENTATION_DOCUMENT' : 'MEDIATION_AGREEMENT'
                                )}
                                disabled={uploading}
                                className="hidden"
                                id={`file-${step.id}`}
                              />
                              <label htmlFor={`file-${step.id}`}>
                                <Button 
                                  variant="default" 
                                  disabled={uploading}
                                  className="cursor-pointer"
                                  asChild
                                >
                                  <span>
                                    {uploading ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Document
                                      </>
                                    )}
                                  </span>
                                </Button>
                              </label>
                            </div>
                          ) : step.action === 'confirm_rep' ? (
                            <Button 
                              onClick={() => handleConfirmation('CONFIRM_REPRESENTATION')}
                              disabled={processing}
                            >
                              {processing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Confirm
                                </>
                              )}
                            </Button>
                          ) : step.action === 'sign_med' ? (
                            <Button 
                              onClick={() => handleConfirmation('SIGN_MEDIATION')}
                              disabled={processing}
                            >
                              {processing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <FileCheck className="mr-2 h-4 w-4" />
                                  Sign Agreement
                                </>
                              )}
                            </Button>
                          ) : null}
                        </div>
                      )}

                      {step.completed && (
                        <Badge variant="default" className="bg-green-600">
                          Completed
                        </Badge>
                      )}

                      {step.current && !step.canAct && (
                        <Badge variant="secondary">
                          Waiting
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Completion Message */}
          {stage3Status.stage3Complete && (
            <div className="mt-6">
              <Alert className="border-green-400 bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800 text-base">
                  <strong>Stage 3 Complete!</strong> All representation and mediation requirements have been fulfilled. 
                  The transaction can now proceed to the Escrow stage.
                </AlertDescription>
              </Alert>
              
              {userRole !== 'admin' && (
                <Button 
                  size="lg"
                  className="w-full mt-4"
                  onClick={() => onStageComplete && onStageComplete()}
                >
                  Proceed to Escrow Stage
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          )}

          {/* Info Box */}
          {!stage3Status.stage3Complete && (
            <Alert className="mt-6 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>What happens in Stage 3?</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Both parties confirm they have legal representation</li>
                  <li>• A mediation agreement is established for dispute resolution</li>
                  <li>• All documents are verified and stored securely</li>
                  <li>• Once complete, funds can be placed in escrow</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Status Summary (for reference) */}
      {userRole === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Detailed Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Representation Document:</span>
                {stage3Status.hasRepresentationDoc ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <Circle className="h-4 w-4 text-gray-400" />
                }
              </div>
              <div className="flex items-center justify-between">
                <span>Mediation Agreement:</span>
                {stage3Status.hasMediationAgreement ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <Circle className="h-4 w-4 text-gray-400" />
                }
              </div>
              <div className="flex items-center justify-between">
                <span>Buyer Confirmed:</span>
                {stage3Status.buyerConfirmed ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <Circle className="h-4 w-4 text-gray-400" />
                }
              </div>
              <div className="flex items-center justify-between">
                <span>Seller Confirmed:</span>
                {stage3Status.sellerConfirmed ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <Circle className="h-4 w-4 text-gray-400" />
                }
              </div>
              <div className="flex items-center justify-between">
                <span>Mediation Signed:</span>
                {stage3Status.mediationSigned ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <Circle className="h-4 w-4 text-gray-400" />
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}