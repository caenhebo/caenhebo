'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  File,
  FileImage,
  Shield
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

interface Property {
  id: string
  code: string
  title: string
  complianceStatus: string
}

const DOCUMENT_CATEGORIES = [
  { value: 'COMPLIANCE_DECLARATION', label: '📋 Compliance Declaration Form', required: true },
  { value: 'ENERGY_CERTIFICATE', label: '🏡 Energy Efficiency Certificate', required: true, description: 'Issued by a qualified technician authorized by ADENE' },
  { value: 'MUNICIPAL_LICENSE', label: '📜 Usage License (Habitation License)', required: true, description: 'Issued by the Municipal Council' },
  { value: 'PREDIAL_REGISTRATION', label: '🏛 Permanent Land Registry Certificate', required: true, description: 'Issued by the IRN' },
  { value: 'CADERNETA_PREDIAL_URBANA', label: '📄 Urban Property Tax Register', required: true, description: 'Issued by the Tax Authority' },
  { value: 'OWNER_AUTHORIZATION', label: '✍️ Owner Authorization Form', required: true, description: 'Written authorization from the property owner to list and sell the property' },
  { value: 'TITLE_DEED', label: '📑 Title Deed', required: false },
  { value: 'FLOOR_PLAN', label: '📐 Floor Plans', required: false },
  { value: 'PHOTO', label: '📷 Property Photos', required: false },
  { value: 'OTHER', label: '📎 Other Documents', required: false }
]

const ALLOWED_FILE_TYPES = {
  'COMPLIANCE_DECLARATION': ['.pdf', '.doc', '.docx'],
  'ENERGY_CERTIFICATE': ['.pdf'],
  'MUNICIPAL_LICENSE': ['.pdf', '.doc', '.docx'],
  'PREDIAL_REGISTRATION': ['.pdf', '.doc', '.docx'],
  'CADERNETA_PREDIAL_URBANA': ['.pdf', '.doc', '.docx'],
  'OWNER_AUTHORIZATION': ['.pdf', '.doc', '.docx'],
  'TITLE_DEED': ['.pdf', '.doc', '.docx'],
  'PHOTO': ['.jpg', '.jpeg', '.png', '.webp'],
  'FLOOR_PLAN': ['.pdf', '.jpg', '.jpeg', '.png'],
  'OTHER': ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt']
}

export default function PropertyDocumentsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [property, setProperty] = useState<Property | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('COMPLIANCE_DECLARATION')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileDescription, setFileDescription] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'SELLER') {
      router.push('/auth/signin')
      return
    }
    fetchPropertyDetails()
    fetchDocuments()
  }, [session, status, id])

  const fetchPropertyDetails = async () => {
    try {
      const response = await fetch(`/api/properties/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        setProperty(data.property)
      } else {
        setError('Failed to load property details')
      }
    } catch (error) {
      console.error('Error fetching property:', error)
      setError('Failed to load property details')
    }
  }

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/properties/${id}/documents/upload`)
      
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      } else {
        console.error('Failed to fetch documents')
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Clear any previous messages
    setUploadError('')
    setUploadSuccess(false)

    // Validate file type
    const allowedTypes = ALLOWED_FILE_TYPES[selectedCategory as keyof typeof ALLOWED_FILE_TYPES] || []
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(fileExtension)) {
      setUploadError(`Invalid file type. Allowed types for ${selectedCategory}: ${allowedTypes.join(', ')}`)
      setSelectedFile(null)
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB')
      setSelectedFile(null)
      return
    }

    setUploadError('')
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setIsUploading(true)
      setUploadError('')

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('type', selectedCategory)
      formData.append('description', fileDescription)

      const response = await fetch(`/api/properties/${id}/documents/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await fetchDocuments()
        setSelectedFile(null)
        setFileDescription('')
        setUploadSuccess(true)
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        // Hide success message after 5 seconds
        setTimeout(() => setUploadSuccess(false), 5000)
      } else {
        const data = await response.json()
        setUploadError(data.error || 'Failed to upload document')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      setUploadError('Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchDocuments()
      } else {
        setError('Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      setError('Failed to delete document')
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
        setError('Failed to download document')
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      setError('Failed to download document')
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return FileImage
    return FileText
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getDocumentsByCategory = (category: string) => {
    return documents.filter(doc => doc.type === category)
  }

  const checkRequiredDocuments = () => {
    const requiredCategories = DOCUMENT_CATEGORIES.filter(cat => cat.required)
    const missingCategories = requiredCategories.filter(cat => 
      getDocumentsByCategory(cat.value).length === 0
    )
    return missingCategories
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Property not found'}</AlertDescription>
          </Alert>
          <Button 
            className="mt-4"
            variant="outline"
            onClick={() => router.push('/seller/properties')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Button>
        </div>
      </div>
    )
  }

  const missingDocuments = checkRequiredDocuments()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/seller/properties/${property.id}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Property
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Property Documents</h1>
              <p className="text-gray-600 mt-1">{property.title} - {property.code}</p>
            </div>
            {property.complianceStatus === 'PENDING' && missingDocuments.length > 0 && (
              <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Missing required documents: {missingDocuments.map(cat => cat.label).join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Property Status Card - When all documents uploaded */}
        {missingDocuments.length === 0 && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">📄 Property Status: Documents Uploaded!</CardTitle>
              <CardDescription className="text-green-700">
                Pending Review - Response within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-green-800">
                  <strong>Status:</strong> All required documents have been uploaded and are pending compliance review.
                </p>
                <p className="text-sm text-green-800">
                  <strong>Next Step:</strong> Our compliance team will review your documents within 24 hours.
                </p>
                <p className="text-sm text-green-800">
                  <strong>Timeline:</strong> You will receive an email notification once the review is complete.
                </p>
                <div className="mt-4 p-3 bg-green-100 rounded-lg">
                  <p className="text-sm text-green-900">
                    💡 <strong>Important:</strong> If you don't receive a response within 24 hours, please contact us at{' '}
                    <a href="mailto:support@caenhebo.com" className="underline font-medium">support@caenhebo.com</a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compliance Status - Moved to Top */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📋 Compliance Status</CardTitle>
            <CardDescription>Portuguese Real Estate Documentation Requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  To list your property legally in Portugal, you must provide the following mandatory documents:
                </p>
                <div className="space-y-2">
                  {DOCUMENT_CATEGORIES.filter(cat => cat.required).map(cat => {
                    const hasDocument = getDocumentsByCategory(cat.value).length > 0;
                    return (
                      <div key={cat.value} className="flex items-start space-x-2">
                        {hasDocument ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{cat.label}</p>
                          {cat.description && (
                            <p className="text-xs text-gray-500">{cat.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                {missingDocuments.length === 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">All required documents uploaded!</span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ready for Compliance Review
                      </Badge>
                    </div>
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription>
                        <p className="font-semibold text-blue-900">Now we will review the documentation.</p>
                        <p className="text-sm text-blue-800 mt-1">
                          You will receive a response within 24 hours. If you haven't received a response by that time, 
                          please send an email to <a href="mailto:support@caenhebo.com" className="underline">support@caenhebo.com</a>
                        </p>
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-700">
                      {missingDocuments.length} required document{missingDocuments.length !== 1 ? 's' : ''} missing
                    </span>
                    <Badge className="bg-amber-100 text-amber-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Incomplete
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        {uploadSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-lg font-semibold text-green-800">
              ✅ Document Successfully Uploaded!
            </AlertDescription>
          </Alert>
        )}

        {/* Owner Authorization Form Template */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Need the Owner Authorization Form?
            </CardTitle>
            <CardDescription>
              Download our template to get written authorization from the property owner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  This form is required to legally list and sell the property on our platform.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  The form must be signed by the property owner and uploaded as a PDF.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = '/api/templates/owner-authorization'
                  link.download = 'owner-authorization-form.txt'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload New Document</CardTitle>
            <CardDescription>
              Upload property-related documents for compliance verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Document Category</Label>
                  <select
                    id="category"
                    className="w-full mt-1 p-2 border rounded-md"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {DOCUMENT_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label} {cat.required && '(Required)'}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const selectedCat = DOCUMENT_CATEGORIES.find(cat => cat.value === selectedCategory);
                    return selectedCat?.description ? (
                      <p className="text-xs text-gray-500 mt-1">{selectedCat.description}</p>
                    ) : null;
                  })()}
                </div>

                <div>
                  <Label htmlFor="file-upload">Select File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileSelect}
                    accept={ALLOWED_FILE_TYPES[selectedCategory as keyof typeof ALLOWED_FILE_TYPES]?.join(',')}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Allowed: {ALLOWED_FILE_TYPES[selectedCategory as keyof typeof ALLOWED_FILE_TYPES]?.join(', ')} (Max 5MB)
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Brief description of the document"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              {uploadError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <File className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    size="sm"
                  >
                    {isUploading ? (
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
          </CardContent>
        </Card>

        {/* Documents List by Category */}
        <div className="space-y-6">
          {DOCUMENT_CATEGORIES.map(category => {
            const categoryDocs = getDocumentsByCategory(category.value)
            const hasDocuments = categoryDocs.length > 0

            return (
              <Card key={category.value}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CardTitle className="text-lg">
                        {category.label}
                      </CardTitle>
                      {category.required && (
                        <span className="ml-2 text-sm text-red-500">*Required</span>
                      )}
                    </div>
                    {hasDocuments && (
                      <Badge 
                        variant="outline" 
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {categoryDocs.length} document{categoryDocs.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {hasDocuments ? (
                    <div className="space-y-3">
                      {categoryDocs.map(doc => {
                        const Icon = getFileIcon(doc.mimeType)
                        return (
                          <div 
                            key={doc.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center flex-1">
                              <Icon className="h-5 w-5 text-gray-500 mr-3" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{doc.originalName}</p>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <span>{formatFileSize(doc.size)}</span>
                                  <span className="mx-2">•</span>
                                  <span>
                                    Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                                  </span>
                                  {doc.description && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span>{doc.description}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownload(doc.id, doc.originalName)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{doc.originalName}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(doc.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        No documents uploaded in this category
                      </p>
                      {category.required && (
                        <p className="text-xs text-red-500 mt-1">
                          This category requires at least one document
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}