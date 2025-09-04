'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Lock,
  FileText,
  Download,
  AlertCircle,
  Clock,
  CheckCircle,
  Shield,
  Loader2,
  File,
  FileImage
} from 'lucide-react'

interface Document {
  id: string
  type: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  createdAt: string
}

interface PropertyDocumentsProps {
  propertyId: string
  propertyCode: string
  sellerId: string
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  'COMPLIANCE_DECLARATION': '📋 Compliance Declaration Form',
  'ENERGY_CERTIFICATE': '🏡 Energy Efficiency Certificate',
  'MUNICIPAL_LICENSE': '📜 Usage License (Habitation License)',
  'PREDIAL_REGISTRATION': '🏛 Permanent Land Registry Certificate',
  'CADERNETA_PREDIAL_URBANA': '📄 Urban Property Tax Register',
  'OWNER_AUTHORIZATION': '✍️ Owner Authorization Form',
  'TITLE_DEED': '📑 Title Deed',
  'FLOOR_PLAN': '📐 Floor Plans',
  'PHOTO': '📷 Property Photos',
  'OTHER': '📎 Other Documents'
}

export function PropertyDocuments({ propertyId, propertyCode, sellerId }: PropertyDocumentsProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [accessReason, setAccessReason] = useState<string>('')
  const [accessDetails, setAccessDetails] = useState<any>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)

  useEffect(() => {
    checkDocumentAccess()
  }, [propertyId])

  const checkDocumentAccess = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/properties/${propertyId}/check-document-access`)
      
      if (response.ok) {
        const data = await response.json()
        setHasAccess(data.hasAccess)
        setAccessReason(data.reason)
        setAccessDetails(data)
        
        // If has access, fetch documents
        if (data.hasAccess) {
          fetchDocuments()
        }
      } else {
        setHasAccess(false)
        setAccessReason('error')
      }
    } catch (error) {
      console.error('Error checking document access:', error)
      setHasAccess(false)
      setAccessReason('error')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      setIsLoadingDocs(true)
      const response = await fetch(`/api/properties/${propertyId}/documents`)
      
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setIsLoadingDocs(false)
    }
  }

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Failed to download document')
      }
    } catch (error) {
      console.error('Error downloading document:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return FileImage
    return FileText
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Documents</CardTitle>
          <CardDescription>Legal and compliance documentation</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (!hasAccess) {
    let message = ''
    let icon = Lock
    
    switch (accessReason) {
      case 'no_permission':
        message = 'The seller has not granted you access to view property documents yet. You can request access by contacting the seller.'
        break
      case 'revoked':
        message = 'Your document access has been revoked by the seller.'
        icon = AlertCircle
        break
      case 'expired':
        message = 'Your document access has expired. Please contact the seller to request renewed access.'
        icon = Clock
        break
      default:
        message = 'You do not have permission to view these documents.'
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Documents</CardTitle>
          <CardDescription>Legal and compliance documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Document Access Required</h3>
            <p className="text-gray-500 max-w-md mx-auto">{message}</p>
            
            <Alert className="mt-6 max-w-md mx-auto">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Document access is controlled by the property seller to protect sensitive information. 
                Serious buyers may request access through the seller.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Property Documents</CardTitle>
            <CardDescription>Legal and compliance documentation</CardDescription>
          </div>
          {accessReason === 'granted' && (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Access Granted
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {accessDetails?.message && (
          <Alert className="mb-4">
            <AlertDescription>
              <strong>Note from seller:</strong> {accessDetails.message}
            </AlertDescription>
          </Alert>
        )}

        {accessDetails?.expiresAt && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Your document access expires on {new Date(accessDetails.expiresAt).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        )}

        {isLoadingDocs ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No documents have been uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.mimeType)
              const typeLabel = DOCUMENT_TYPE_LABELS[doc.type] || doc.type
              
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-sm">{typeLabel}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{doc.originalName}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(doc.id, doc.originalName)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}