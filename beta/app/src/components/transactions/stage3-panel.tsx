'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Users,
  Shield,
  FileCheck,
  Download
} from 'lucide-react'

interface Stage3PanelProps {
  transactionId: string
  userRole: 'buyer' | 'seller' | 'admin'
  userId: string
  onStageComplete?: () => void
}

export default function Stage3Panel({ 
  transactionId, 
  userRole, 
  userId,
  onStageComplete 
}: Stage3PanelProps) {
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [stage3Status, setStage3Status] = useState({
    hasRepresentationDoc: false,
    hasMediationAgreement: false,
    buyerConfirmed: false,
    sellerConfirmed: false,
    mediationSigned: false,
    stage3Complete: false,
    canAdvanceToEscrow: false
  })
  const [documents, setDocuments] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch Stage 3 status
  const fetchStage3Status = async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/stage3`)
      
      if (!response.ok) {
        // Try to get error message from response
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
      
      // Handle the response data properly
      if (data.status) {
        setStage3Status(data.status)
      }
      if (data.documents) {
        setDocuments(data.documents)
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

  // Handle document upload
  const handleDocumentUpload = async (file: File, documentType: string) => {
    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', documentType)
      formData.append('title', documentType === 'REPRESENTATION_DOCUMENT' 
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

      setSuccess(`${documentType === 'REPRESENTATION_DOCUMENT' ? 'Representation document' : 'Mediation agreement'} uploaded successfully`)
      await fetchStage3Status() // Refresh status
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  // Handle confirmation actions
  const handleConfirmation = async (action: string) => {
    try {
      setError(null)
      setSuccess(null)

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
      setSuccess(data.message)
      await fetchStage3Status() // Refresh status

      if (data.stage3Complete && onStageComplete) {
        onStageComplete()
      }
    } catch (err) {
      console.error('Confirmation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to confirm')
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (file) {
      handleDocumentUpload(file, docType)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stage 3 Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Stage 3: Representation & Mediation
          </CardTitle>
          <CardDescription>
            Legal representation documents and mediation agreement required before proceeding to escrow
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              {stage3Status.hasRepresentationDoc ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
              <span className="text-sm">Representation Doc</span>
            </div>
            <div className="flex items-center space-x-2">
              {stage3Status.hasMediationAgreement ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
              <span className="text-sm">Mediation Agreement</span>
            </div>
            <div className="flex items-center space-x-2">
              {stage3Status.buyerConfirmed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
              <span className="text-sm">Buyer Confirmed</span>
            </div>
            <div className="flex items-center space-x-2">
              {stage3Status.sellerConfirmed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
              <span className="text-sm">Seller Confirmed</span>
            </div>
            <div className="flex items-center space-x-2">
              {stage3Status.mediationSigned ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
              <span className="text-sm">Mediation Signed</span>
            </div>
            <div className="flex items-center space-x-2">
              {stage3Status.stage3Complete ? (
                <Badge variant="default" className="bg-green-500">Complete</Badge>
              ) : (
                <Badge variant="secondary">In Progress</Badge>
              )}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {stage3Status.stage3Complete && (
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                All Stage 3 requirements completed! Transaction can now proceed to Escrow.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Required Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Representation Document */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium">Legal Representation Document</h4>
                <p className="text-sm text-gray-600">
                  Document confirming legal representation for the transaction
                </p>
              </div>
              {stage3Status.hasRepresentationDoc ? (
                <Badge variant="default" className="bg-green-500">
                  <FileCheck className="h-3 w-3 mr-1" />
                  Uploaded
                </Badge>
              ) : (
                <Badge variant="secondary">Required</Badge>
              )}
            </div>
            
            {!stage3Status.hasRepresentationDoc && (userRole !== 'admin') && (
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 'REPRESENTATION_DOCUMENT')}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            )}
          </div>

          {/* Mediation Agreement */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium">Mediation Agreement</h4>
                <p className="text-sm text-gray-600">
                  Agreement for mediation services in case of disputes
                </p>
              </div>
              {stage3Status.hasMediationAgreement ? (
                <Badge variant="default" className="bg-green-500">
                  <FileCheck className="h-3 w-3 mr-1" />
                  Uploaded
                </Badge>
              ) : (
                <Badge variant="secondary">Required</Badge>
              )}
            </div>
            
            {!stage3Status.hasMediationAgreement && (userRole !== 'admin') && (
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 'MEDIATION_AGREEMENT')}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Party Confirmations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buyer Confirmation */}
          {userRole === 'buyer' && !stage3Status.buyerConfirmed && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium mb-2">Confirm Legal Representation</h4>
              <p className="text-sm text-gray-600 mb-3">
                By confirming, you acknowledge that you have legal representation for this transaction.
              </p>
              <Button 
                onClick={() => handleConfirmation('CONFIRM_REPRESENTATION')}
                disabled={!stage3Status.hasRepresentationDoc}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Representation
              </Button>
              {!stage3Status.hasRepresentationDoc && (
                <p className="text-xs text-red-500 mt-2">
                  Upload representation document first
                </p>
              )}
            </div>
          )}

          {/* Seller Confirmation */}
          {userRole === 'seller' && !stage3Status.sellerConfirmed && (
            <div className="border rounded-lg p-4 bg-orange-50">
              <h4 className="font-medium mb-2">Confirm Legal Representation</h4>
              <p className="text-sm text-gray-600 mb-3">
                By confirming, you acknowledge that you have legal representation for this transaction.
              </p>
              <Button 
                onClick={() => handleConfirmation('CONFIRM_REPRESENTATION')}
                disabled={!stage3Status.hasRepresentationDoc}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Representation
              </Button>
              {!stage3Status.hasRepresentationDoc && (
                <p className="text-xs text-red-500 mt-2">
                  Upload representation document first
                </p>
              )}
            </div>
          )}

          {/* Mediation Agreement Signing */}
          {(userRole === 'buyer' || userRole === 'seller') && 
           !stage3Status.mediationSigned && 
           stage3Status.hasMediationAgreement && (
            <div className="border rounded-lg p-4 bg-purple-50">
              <h4 className="font-medium mb-2">Sign Mediation Agreement</h4>
              <p className="text-sm text-gray-600 mb-3">
                Confirm that you agree to the mediation terms outlined in the uploaded agreement.
              </p>
              <Button 
                onClick={() => handleConfirmation('SIGN_MEDIATION')}
                variant="default"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Sign Mediation Agreement
              </Button>
            </div>
          )}

          {/* Status Summary */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Confirmation Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Buyer Representation:</span>
                {stage3Status.buyerConfirmed ? (
                  <Badge variant="default" className="bg-green-500">Confirmed</Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>Seller Representation:</span>
                {stage3Status.sellerConfirmed ? (
                  <Badge variant="default" className="bg-green-500">Confirmed</Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>Mediation Agreement:</span>
                {stage3Status.mediationSigned ? (
                  <Badge variant="default" className="bg-green-500">Signed</Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Uploaded Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">{doc.title || doc.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {doc.type} • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advance to Escrow Button */}
      {stage3Status.canAdvanceToEscrow && userRole !== 'admin' && (
        <Card>
          <CardContent className="pt-6">
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All Stage 3 requirements have been completed. You can now advance to the Escrow stage.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => onStageComplete && onStageComplete()}
            >
              Proceed to Escrow Stage
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}