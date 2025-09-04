'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  FileText, 
  Image, 
  File, 
  Download, 
  Trash2, 
  Eye,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  FolderOpen
} from 'lucide-react'

interface Document {
  id: string
  type: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  title?: string
  description?: string
  createdAt: string
  userId: string
}

interface DocumentListProps {
  entityId: string
  entityType: 'property' | 'transaction'
  currentUserId: string
  userRole: string
  onDocumentDeleted?: () => void
  className?: string
}

const DOCUMENT_TYPE_LABELS: { [key: string]: string } = {
  // Property Documents
  'TITLE_DEED': 'Title Deed',
  'CERTIFICATE': 'Certificate',
  'PHOTO': 'Property Photo',
  'FLOOR_PLAN': 'Floor Plan',
  // Transaction Documents
  'CONTRACT': 'Contract',
  'PROOF_OF_PAYMENT': 'Proof of Payment',
  'LEGAL_DOCUMENT': 'Legal Document',
  'MEDIATION_AGREEMENT': 'Mediation Agreement',
  'PURCHASE_AGREEMENT': 'Purchase Agreement',
  'PAYMENT_PROOF': 'Payment Proof',
  'NOTARIZED_DOCUMENT': 'Notarized Document',
  // Common
  'OTHER': 'Other Document'
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) {
    return <Image className="h-4 w-4" />
  } else if (mimeType === 'application/pdf') {
    return <FileText className="h-4 w-4" />
  }
  return <File className="h-4 w-4" />
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getDocumentTypeColor = (type: string) => {
  const colorMap: { [key: string]: string } = {
    'TITLE_DEED': 'bg-purple-100 text-purple-800',
    'CERTIFICATE': 'bg-green-100 text-green-800',
    'PHOTO': 'bg-blue-100 text-blue-800',
    'FLOOR_PLAN': 'bg-cyan-100 text-cyan-800',
    'CONTRACT': 'bg-red-100 text-red-800',
    'PROOF_OF_PAYMENT': 'bg-yellow-100 text-yellow-800',
    'LEGAL_DOCUMENT': 'bg-indigo-100 text-indigo-800'
  }
  return colorMap[type] || 'bg-gray-100 text-gray-800'
}

export default function DocumentList({
  entityId,
  entityType,
  currentUserId,
  userRole,
  onDocumentDeleted,
  className
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [entityId, entityType])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      setError('')

      const endpoint = entityType === 'property' 
        ? `/api/properties/${entityId}/documents/upload`
        : `/api/transactions/${entityId}/documents/upload`

      const response = await fetch(endpoint)

      if (!response.ok) {
        if (response.status === 403) {
          setError('You do not have permission to view documents for this ' + entityType)
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch documents')
        }
        return
      }

      const data = await response.json()
      setDocuments(data.documents || [])

    } catch (error) {
      console.error('Error fetching documents:', error)
      setError(error instanceof Error ? error.message : 'Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    setDeletingId(documentId)
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete document')
      }

      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      onDocumentDeleted?.()

    } catch (error) {
      console.error('Error deleting document:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete document')
    } finally {
      setDeletingId(null)
    }
  }

  const handleView = (document: Document) => {
    // Open document in new tab
    window.open(`/api/uploads/${entityType === 'property' ? 'properties' : 'transactions'}/${entityId}/${document.filename}`, '_blank')
  }

  const canDeleteDocument = (document: Document) => {
    return userRole === 'ADMIN' || document.userId === currentUserId
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Loading documents...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FolderOpen className="mr-2 h-5 w-5" />
          Documents ({documents.length})
        </CardTitle>
        <CardDescription>
          Documents uploaded for this {entityType}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getFileIcon(document.mimeType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {document.title || document.originalName}
                        </h4>
                        <Badge className={`text-xs ${getDocumentTypeColor(document.type)}`}>
                          {DOCUMENT_TYPE_LABELS[document.type] || document.type}
                        </Badge>
                      </div>
                      
                      {document.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {document.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <File className="mr-1 h-3 w-3" />
                          {formatFileSize(document.size)}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(document.createdAt)}
                        </div>
                        {document.userId === currentUserId && (
                          <div className="flex items-center">
                            <User className="mr-1 h-3 w-3" />
                            Uploaded by you
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(document)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {canDeleteDocument(document) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
                        disabled={deletingId === document.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingId === document.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}