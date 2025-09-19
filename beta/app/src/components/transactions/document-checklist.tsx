'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  CheckCircle,
  XCircle,
  Upload,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface DocumentChecklistProps {
  transactionId: string
  userRole: 'buyer' | 'seller' | 'admin'
  onComplete?: () => void
}

interface ChecklistItem {
  id: string
  title: string
  description: string
  required: boolean
  uploaded: boolean
  verified: boolean
  documentType: string
  requiredFor: 'buyer' | 'seller' | 'both'
}

const REQUIRED_DOCUMENTS: ChecklistItem[] = [
  {
    id: 'property_deed',
    title: 'Property Deed',
    description: 'Official property ownership document from the land registry',
    required: true,
    uploaded: false,
    verified: false,
    documentType: 'PROPERTY_DEED',
    requiredFor: 'seller'
  },
  {
    id: 'tax_certificate',
    title: 'Tax Certificates',
    description: 'IMI and IMT tax certificates showing no outstanding payments',
    required: true,
    uploaded: false,
    verified: false,
    documentType: 'TAX_CERTIFICATE',
    requiredFor: 'seller'
  },
  {
    id: 'energy_certificate',
    title: 'Energy Certificate',
    description: 'Energy efficiency certificate for the property',
    required: true,
    uploaded: false,
    verified: false,
    documentType: 'ENERGY_CERTIFICATE',
    requiredFor: 'seller'
  },
  {
    id: 'caderneta_predial',
    title: 'Caderneta Predial',
    description: 'Property registration document from tax authorities',
    required: true,
    uploaded: false,
    verified: false,
    documentType: 'CADERNETA_PREDIAL',
    requiredFor: 'seller'
  },
  {
    id: 'habitability_license',
    title: 'Habitability License',
    description: 'License confirming the property is suitable for habitation',
    required: true,
    uploaded: false,
    verified: false,
    documentType: 'HABITABILITY_LICENSE',
    requiredFor: 'seller'
  },
  {
    id: 'mortgage_clearance',
    title: 'Mortgage Clearance (if applicable)',
    description: 'Document showing no outstanding mortgage on the property',
    required: false,
    uploaded: false,
    verified: false,
    documentType: 'MORTGAGE_CLEARANCE',
    requiredFor: 'seller'
  },
  {
    id: 'proof_of_funds',
    title: 'Proof of Funds',
    description: 'Bank statement or letter confirming available funds',
    required: true,
    uploaded: false,
    verified: false,
    documentType: 'PROOF_OF_FUNDS',
    requiredFor: 'buyer'
  },
  {
    id: 'id_document',
    title: 'ID Document',
    description: 'Valid passport or national ID card',
    required: true,
    uploaded: false,
    verified: false,
    documentType: 'ID_DOCUMENT',
    requiredFor: 'both'
  },
  {
    id: 'nif_certificate',
    title: 'NIF Certificate',
    description: 'Portuguese tax identification number certificate',
    required: true,
    uploaded: false,
    verified: false,
    documentType: 'NIF_CERTIFICATE',
    requiredFor: 'both'
  }
]

export default function DocumentChecklist({
  transactionId,
  userRole,
  onComplete
}: DocumentChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(REQUIRED_DOCUMENTS)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch uploaded documents
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/documents`)

      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const data = await response.json()

      // Update checklist with uploaded documents
      const updatedChecklist = REQUIRED_DOCUMENTS.map(item => {
        const uploadedDoc = data.documents?.find(
          (doc: any) => doc.documentType === item.documentType
        )

        return {
          ...item,
          uploaded: !!uploadedDoc,
          verified: uploadedDoc?.verified || false
        }
      })

      setChecklist(updatedChecklist)
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
    // Refresh every 10 seconds
    const interval = setInterval(fetchDocuments, 10000)
    return () => clearInterval(interval)
  }, [transactionId])

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, item: ChecklistItem) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(item.id)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', item.documentType)
      formData.append('title', item.title)
      formData.append('description', item.description)

      const response = await fetch(`/api/transactions/${transactionId}/documents/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      setSuccess(`✅ ${item.title} uploaded successfully!`)
      await fetchDocuments()
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setUploading(null)
    }
  }

  // Filter documents based on user role
  const relevantDocuments = checklist.filter(item =>
    item.requiredFor === 'both' ||
    item.requiredFor === userRole ||
    userRole === 'admin'
  )

  const requiredDocuments = relevantDocuments.filter(item => item.required)
  const optionalDocuments = relevantDocuments.filter(item => !item.required)

  const uploadedCount = requiredDocuments.filter(item => item.uploaded).length
  const totalRequired = requiredDocuments.length
  const allRequiredUploaded = uploadedCount === totalRequired

  // Calculate completion percentage
  const completionPercentage = totalRequired > 0
    ? Math.round((uploadedCount / totalRequired) * 100)
    : 0

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-3">Loading document checklist...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="border-2 border-blue-400">
        <CardHeader>
          <CardTitle className="text-2xl">Document Verification Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Documents Uploaded</span>
              <span className="font-semibold">{uploadedCount} of {totalRequired}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-2xl font-bold">{completionPercentage}%</span>
              <span className="text-gray-600 ml-2">Complete</span>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-400 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {allRequiredUploaded && (
            <Alert className="mb-4 border-green-400 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All required documents have been uploaded! 🎉
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Required Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Required Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requiredDocuments.map(item => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 ${
                  item.uploaded ? 'border-green-400 bg-green-50' : 'border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      {item.uploaded ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      {item.verified && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1 ml-7">{item.description}</p>
                    <p className="text-sm text-gray-500 mt-1 ml-7">
                      Required for: {item.requiredFor === 'both' ? 'Buyer & Seller' :
                                    item.requiredFor === 'buyer' ? 'Buyer' : 'Seller'}
                    </p>
                  </div>

                  {!item.uploaded && (item.requiredFor === userRole || item.requiredFor === 'both') && (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, item)}
                        disabled={uploading === item.id}
                        className="hidden"
                        id={`upload-${item.id}`}
                      />
                      <label htmlFor={`upload-${item.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={uploading === item.id}
                          asChild
                        >
                          <span className="cursor-pointer">
                            {uploading === item.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optional Documents */}
      {optionalDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Optional Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optionalDocuments.map(item => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    item.uploaded ? 'border-green-400 bg-green-50' : 'border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        {item.uploaded ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        )}
                        <h3 className="font-semibold">{item.title}</h3>
                        {item.verified && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-1 ml-7">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1 ml-7">
                        Required for: {item.requiredFor === 'both' ? 'Buyer & Seller' :
                                      item.requiredFor === 'buyer' ? 'Buyer' : 'Seller'}
                      </p>
                    </div>

                    {!item.uploaded && (item.requiredFor === userRole || item.requiredFor === 'both') && (
                      <div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, item)}
                          disabled={uploading === item.id}
                          className="hidden"
                          id={`upload-${item.id}`}
                        />
                        <label htmlFor={`upload-${item.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={uploading === item.id}
                            asChild
                          >
                            <span className="cursor-pointer">
                              {uploading === item.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Button */}
      {allRequiredUploaded && onComplete && (
        <Card className="border-2 border-green-400">
          <CardContent className="py-6">
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={onComplete}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              All Documents Uploaded - Continue to Next Stage
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}