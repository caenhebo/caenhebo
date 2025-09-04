'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface DocumentUploadProps {
  entityId: string
  entityType: 'property' | 'transaction'
  allowedTypes: string[]
  onUploadComplete?: (document: any) => void
  className?: string
}

const DOCUMENT_CATEGORIES = {
  property: [
    { value: 'OWNER_AUTHORIZATION', label: 'Owner Authorization Form' },
    { value: 'TITLE_DEED', label: 'Title Deed' },
    { value: 'CERTIFICATE', label: 'Certificate' },
    { value: 'PHOTO', label: 'Property Photo' },
    { value: 'FLOOR_PLAN', label: 'Floor Plan' },
    { value: 'OTHER', label: 'Other Document' }
  ],
  transaction: [
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'PROOF_OF_PAYMENT', label: 'Proof of Payment' },
    { value: 'LEGAL_DOCUMENT', label: 'Legal Document' },
    { value: 'MEDIATION_AGREEMENT', label: 'Mediation Agreement' },
    { value: 'PURCHASE_AGREEMENT', label: 'Purchase Agreement' },
    { value: 'PAYMENT_PROOF', label: 'Payment Proof' },
    { value: 'NOTARIZED_DOCUMENT', label: 'Notarized Document' },
    { value: 'OTHER', label: 'Other Document' }
  ]
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

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

export default function DocumentUpload({ 
  entityId, 
  entityType, 
  allowedTypes,
  onUploadComplete,
  className 
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const categories = DOCUMENT_CATEGORIES[entityType]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File size too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`)
      return
    }

    // Validate file type if allowedTypes provided
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      setUploadError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`)
      return
    }

    setSelectedFile(file)
    setUploadError('')
    setUploadSuccess(false)
  }

  const clearFile = () => {
    setSelectedFile(null)
    setUploadError('')
    setUploadSuccess(false)
    setUploadProgress(0)
  }

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      setUploadError('Please select a file and document type')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('type', documentType)
      if (title) formData.append('title', title)
      if (description) formData.append('description', description)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const endpoint = entityType === 'property' 
        ? `/api/properties/${entityId}/documents/upload`
        : `/api/transactions/${entityId}/documents/upload`

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      
      setUploadSuccess(true)
      onUploadComplete?.(data.document)

      // Reset form
      setTimeout(() => {
        setSelectedFile(null)
        setDocumentType('')
        setTitle('')
        setDescription('')
        setUploadProgress(0)
        setUploadSuccess(false)
      }, 2000)

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="mr-2 h-5 w-5" />
          Upload Document
        </CardTitle>
        <CardDescription>
          Upload documents related to this {entityType}. Maximum file size: {formatFileSize(MAX_FILE_SIZE)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Selection */}
        <div>
          <Label htmlFor="file-upload">Choose File</Label>
          <div className="mt-1">
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              accept={allowedTypes.length > 0 ? allowedTypes.join(',') : undefined}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Selected File Display */}
        {selectedFile && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getFileIcon(selectedFile.type)}
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Document Type */}
        <div>
          <Label htmlFor="document-type">Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType} disabled={isUploading}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Title (Optional)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title"
            disabled={isUploading}
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter document description"
            rows={2}
            disabled={isUploading}
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Error Alert */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {uploadSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Document uploaded successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !documentType || isUploading}
          className="w-full"
        >
          {isUploading ? (
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
        </Button>
      </CardContent>
    </Card>
  )
}