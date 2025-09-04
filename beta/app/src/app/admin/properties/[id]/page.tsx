'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  MapPin, 
  Euro, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Download,
  FileText,
  CalendarPlus,
  ClipboardList,
  ArrowLeft,
  User,
  Mail,
  Phone,
  AlertTriangle,
  Shield,
  MessageSquare,
  Home,
  CheckSquare
} from 'lucide-react'

interface Document {
  id: string
  filename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  documentType: string
  uploadedAt: string
  verified: boolean
}

interface Property {
  id: string
  code: string
  title: string
  description?: string
  address: string
  city: string
  state?: string
  postalCode: string
  country: string
  price: string
  area?: number
  bedrooms?: number
  bathrooms?: number
  complianceStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  complianceNotes?: string
  valuationPrice?: string
  documentStatus: 'NOT_STARTED' | 'INCOMPLETE' | 'COMPLETE' | 'APPROVED'
  interviewStatus: 'NOT_SCHEDULED' | 'SCHEDULED' | 'COMPLETED' 
  interviewDate?: string
  interviewNotes?: string
  finalApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  sellerId: string
  seller: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    phoneNumber?: string
  }
  documents: Document[]
  createdAt: string
  updatedAt: string
}

const APPROVAL_STEPS = [
  { id: 1, name: 'Documents Submitted', key: 'documents' },
  { id: 2, name: 'Compliance Review', key: 'compliance' },
  { id: 3, name: 'Interview', key: 'interview' },
  { id: 4, name: 'Property Approved', key: 'approved' }
]

export default function AdminPropertyDetails() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCalendarDialog, setShowCalendarDialog] = useState(false)
  const [showAuditDialog, setShowAuditDialog] = useState(false)
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewTime, setInterviewTime] = useState('')
  const [auditNotes, setAuditNotes] = useState('')
  const [complianceNotes, setComplianceNotes] = useState('')
  const [valuationPrice, setValuationPrice] = useState('')

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/auth/signin')
      return
    }
    fetchPropertyDetails()
  }, [params.id])

  const fetchPropertyDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/properties/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch property details')
      }

      const data = await response.json()
      setProperty(data.property)
      setComplianceNotes(data.property.complianceNotes || '')
      setValuationPrice(data.property.valuationPrice || '')
    } catch (error) {
      console.error('Error fetching property:', error)
      setError('Failed to load property details')
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentStep = () => {
    if (!property) return 0
    
    // Step 0: Check if all required documents are uploaded
    const hasRequiredDocs = property.documents && property.documents.length >= 5
    if (!hasRequiredDocs) return 0 // Waiting for documents
    
    // Step 1: Documents uploaded, now in compliance review
    if (property.complianceStatus === 'PENDING' || property.complianceStatus === 'REJECTED') {
      return 1 // Compliance review stage
    }
    
    // Step 2: Compliance passed, now in interview stage
    if (property.complianceStatus === 'APPROVED') {
      // Debug logging
      console.log('Interview Status:', property.interviewStatus)
      console.log('Final Approval Status:', property.finalApprovalStatus)
      
      // Still in interview stage until interview is marked complete
      if (property.interviewStatus !== 'COMPLETED') {
        return 2 // Interview stage (scheduling or scheduled)
      }
      
      // Step 3: Interview completed, awaiting final approval
      if (property.interviewStatus === 'COMPLETED' && property.finalApprovalStatus !== 'APPROVED') {
        return 3 // Final approval stage
      }
      
      // Step 4: Fully approved
      if (property.finalApprovalStatus === 'APPROVED') {
        return 4 // Property fully approved
      }
    }
    
    return 0
  }

  const handleComplianceAction = async (status: 'APPROVED' | 'REJECTED') => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/properties/compliance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property?.id,
          complianceStatus: status,
          complianceNotes: complianceNotes.trim() || null,
          valuationPrice: valuationPrice.trim() || null
        })
      })

      if (!response.ok) throw new Error('Failed to update compliance status')
      
      await fetchPropertyDetails()
    } catch (error) {
      setError('Failed to update compliance status')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleScheduleInterview = async () => {
    if (!interviewDate || !interviewTime) {
      setError('Please select both date and time')
      return
    }

    setIsProcessing(true)
    try {
      const interviewDateTime = `${interviewDate}T${interviewTime}:00`
      const response = await fetch(`/api/admin/properties/${property?.id}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewDate: interviewDateTime })
      })

      if (!response.ok) throw new Error('Failed to schedule interview')
      
      // Generate calendar link
      const calendarLink = generateCalendarLink(interviewDateTime)
      window.open(calendarLink, '_blank')
      
      setShowCalendarDialog(false)
      await fetchPropertyDetails()
    } catch (error) {
      setError('Failed to schedule interview')
    } finally {
      setIsProcessing(false)
    }
  }

  const generateCalendarLink = (dateTime: string) => {
    const date = new Date(dateTime)
    const endDate = new Date(date.getTime() + 60 * 60 * 1000) // 1 hour duration
    
    const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    
    const details = `Property Interview for ${property?.title}%0AProperty Code: ${property?.code}%0ASeller: ${property?.seller.firstName} ${property?.seller.lastName}%0AEmail: ${property?.seller.email}`
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Property%20Interview%20-%20${property?.code}&dates=${formatDate(date)}/${formatDate(endDate)}&details=${details}&location=${property?.address}, ${property?.city}`
  }

  const handleCreateAudit = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/properties/${property?.id}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: auditNotes })
      })

      if (!response.ok) throw new Error('Failed to create audit')
      
      setShowAuditDialog(false)
      setAuditNotes('')
      await fetchPropertyDetails()
    } catch (error) {
      setError('Failed to create audit')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      COMPLIANCE_DECLARATION: '📋 Compliance Declaration',
      ENERGY_CERTIFICATE: '🏡 Energy Certificate',
      USAGE_LICENSE: '📜 Usage License',
      LAND_REGISTRY: '🏛 Land Registry Certificate',
      TAX_REGISTER: '📄 Tax Register',
      FLOOR_PLAN: '📐 Floor Plan',
      TITLE_DEED: '📑 Title Deed',
      PHOTO: '📷 Photo',
      OTHER: '📎 Other'
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertDescription>Property not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const currentStep = getCurrentStep()
  
  // Determine default tab based on current stage
  const getDefaultTab = () => {
    switch (currentStep) {
      case 0: return 'documents' // Waiting for documents
      case 1: return 'compliance' // In compliance review
      case 2: return 'interview' // Interview stage
      case 3: return 'compliance' // Final approval (shown in compliance tab)
      case 4: return 'details' // Approved - show details
      default: return 'details'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="font-mono text-blue-600">#{property.code}</span>
                {getStatusBadge(property.complianceStatus)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAuditDialog(true)}
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Create Audit
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Approval Process Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Approval Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
              <div className="relative flex justify-between">
                {APPROVAL_STEPS.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold z-10 ${
                      index < currentStep ? 'bg-green-500' : 
                      index === currentStep ? 'bg-blue-500' : 
                      'bg-gray-300'
                    }`}>
                      {index < currentStep ? <CheckCircle className="h-6 w-6" /> : step.id}
                    </div>
                    <span className={`mt-2 text-sm ${
                      index <= currentStep ? 'font-semibold' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                    
                    {/* Add interview button for step 3 */}
                    {step.key === 'interview' && property.complianceStatus === 'APPROVED' && property.interviewStatus !== 'COMPLETED' && (
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => setShowCalendarDialog(true)}
                      >
                        <CalendarPlus className="h-4 w-4 mr-1" />
                        {property.interviewDate ? 'Reschedule' : 'Schedule'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Show current status details */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              {currentStep === 0 && (
                <p className="text-sm text-gray-600">
                  <AlertTriangle className="h-4 w-4 inline mr-2 text-yellow-500" />
                  Waiting for seller to upload required documents.
                </p>
              )}
              {currentStep === 1 && (
                <p className="text-sm text-gray-600">
                  <FileText className="h-4 w-4 inline mr-2 text-blue-500" />
                  Documents uploaded. Ready for compliance review.
                </p>
              )}
              {currentStep === 2 && (
                <div>
                  <p className="text-sm text-gray-600">
                    <CheckSquare className="h-4 w-4 inline mr-2 text-green-500" />
                    Compliance review passed. Interview needs to be scheduled.
                  </p>
                  {property.interviewDate && (
                    <p className="text-sm text-purple-600 mt-2">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Interview scheduled: {new Date(property.interviewDate).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    <MessageSquare className="h-4 w-4 inline mr-2 text-purple-500" />
                    Interview completed. Property is ready for final approval.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={async () => {
                        setIsProcessing(true)
                        try {
                          const response = await fetch(`/api/admin/properties/${property.id}/final-approval`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'APPROVED' })
                          })
                          if (response.ok) await fetchPropertyDetails()
                        } catch (error) {
                          setError('Failed to approve property')
                        } finally {
                          setIsProcessing(false)
                        }
                      }}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Give Final Approval
                    </Button>
                    <Button
                      onClick={async () => {
                        setIsProcessing(true)
                        try {
                          const response = await fetch(`/api/admin/properties/${property.id}/final-approval`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'REJECTED' })
                          })
                          if (response.ok) await fetchPropertyDetails()
                        } catch (error) {
                          setError('Failed to reject property')
                        } finally {
                          setIsProcessing(false)
                        }
                      }}
                      disabled={isProcessing}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Property
                    </Button>
                  </div>
                </div>
              )}
              {currentStep === 4 && (
                <p className="text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  Property approved and ready for transactions.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={getDefaultTab()} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Property Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="seller">Seller Info</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="interview">Interview</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Address</Label>
                    <div className="mt-1">
                      <p className="font-medium">{property.address}</p>
                      <p className="text-gray-600">{property.city}, {property.postalCode}</p>
                      <p className="text-gray-600">{property.country}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Price</Label>
                    <p className="mt-1 text-2xl font-bold">€{parseInt(property.price).toLocaleString()}</p>
                    {property.valuationPrice && (
                      <p className="text-sm text-gray-600">Valuation: €{parseInt(property.valuationPrice).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                
                {property.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <p className="mt-1">{property.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-4">
                  {property.area && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Area</Label>
                      <p className="mt-1">{property.area} m²</p>
                    </div>
                  )}
                  {property.bedrooms && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Bedrooms</Label>
                      <p className="mt-1">{property.bedrooms}</p>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Bathrooms</Label>
                      <p className="mt-1">{property.bathrooms}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Listed</Label>
                    <p className="mt-1">{new Date(property.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents ({property.documents.length})</CardTitle>
                <CardDescription>Review and download property documents</CardDescription>
              </CardHeader>
              <CardContent>
                {property.documents.length > 0 ? (
                  <div className="space-y-3">
                    {property.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-medium">{getDocumentTypeLabel(doc.documentType)}</p>
                            <p className="text-sm text-gray-600">
                              {doc.filename} • {formatFileSize(doc.fileSize)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/api/documents/${doc.id}/download`}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No documents uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seller">
            <Card>
              <CardHeader>
                <CardTitle>Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Name</Label>
                    <p className="mt-1 flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {property.seller.firstName} {property.seller.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="mt-1 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {property.seller.email}
                    </p>
                  </div>
                  {property.seller.phoneNumber && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                      <p className="mt-1 flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {property.seller.phoneNumber}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Current Status</Label>
                  <div className="mt-2">{getStatusBadge(property.complianceStatus)}</div>
                </div>

                {property.interviewDate && (
                  <div>
                    <Label>Interview Scheduled</Label>
                    <p className="mt-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(property.interviewDate).toLocaleString()}
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="valuationPrice">Admin Valuation (Optional)</Label>
                  <Input
                    id="valuationPrice"
                    type="number"
                    value={valuationPrice}
                    onChange={(e) => setValuationPrice(e.target.value)}
                    placeholder="Enter valuation price in EUR"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="complianceNotes">Compliance Notes</Label>
                  <Textarea
                    id="complianceNotes"
                    value={complianceNotes}
                    onChange={(e) => setComplianceNotes(e.target.value)}
                    placeholder="Add notes about compliance review..."
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  {property.complianceStatus === 'PENDING' && (
                    <>
                      <Button
                        onClick={() => handleComplianceAction('APPROVED')}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve Compliance
                      </Button>
                      <Button
                        onClick={() => handleComplianceAction('REJECTED')}
                        disabled={isProcessing}
                        variant="destructive"
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Reject Compliance
                      </Button>
                    </>
                  )}
                  
                  {property.complianceStatus === 'APPROVED' && (
                    <Button
                      onClick={() => handleComplianceAction('REJECTED')}
                      disabled={isProcessing}
                      variant="destructive"
                      className="w-full"
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Revoke Compliance Approval
                    </Button>
                  )}
                  
                  {property.complianceStatus === 'REJECTED' && (
                    <Button
                      onClick={() => handleComplianceAction('APPROVED')}
                      disabled={isProcessing}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve Compliance
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interview">
            <Card>
              <CardHeader>
                <CardTitle>Property Interview</CardTitle>
                <CardDescription>Schedule and manage property interviews</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {property.complianceStatus !== 'APPROVED' ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Property must pass compliance review before scheduling interviews.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div>
                      <Label>Interview Status</Label>
                      <div className="mt-2 flex items-center gap-4">
                        {property.interviewStatus === 'NOT_SCHEDULED' && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Not Scheduled
                          </Badge>
                        )}
                        {property.interviewStatus === 'SCHEDULED' && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Calendar className="h-3 w-3 mr-1" />
                            Scheduled
                          </Badge>
                        )}
                        {property.interviewStatus === 'COMPLETED' && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>

                    {property.interviewDate && (
                      <div>
                        <Label>Scheduled Date & Time</Label>
                        <p className="mt-1 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(property.interviewDate).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {property.interviewStatus !== 'COMPLETED' && (
                      <div>
                        <Button
                          onClick={() => setShowCalendarDialog(true)}
                          className="w-full"
                        >
                          <CalendarPlus className="h-4 w-4 mr-2" />
                          {property.interviewDate ? 'Reschedule Interview' : 'Schedule Interview'}
                        </Button>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="interviewNotes">Interview Notes</Label>
                      <Textarea
                        id="interviewNotes"
                        value={property.interviewNotes || ''}
                        onChange={(e) => setProperty({...property, interviewNotes: e.target.value})}
                        placeholder="Add notes from the interview..."
                        className="mt-2"
                        rows={6}
                      />
                      {property.interviewStatus === 'SCHEDULED' && (
                        <Button
                          onClick={async () => {
                            setIsProcessing(true)
                            try {
                              const response = await fetch(`/api/admin/properties/${property.id}/interview`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  notes: property.interviewNotes
                                })
                              })
                              if (response.ok) {
                                setError('')
                                alert('Interview notes saved')
                              }
                            } catch (error) {
                              setError('Failed to save interview notes')
                            } finally {
                              setIsProcessing(false)
                            }
                          }}
                          disabled={isProcessing}
                          variant="outline"
                          className="mt-2 w-full"
                        >
                          Save Interview Notes
                        </Button>
                      )}
                    </div>

                    {property.interviewStatus === 'SCHEDULED' && (
                      <div className="flex gap-3">
                        <Button
                          onClick={async () => {
                            setIsProcessing(true)
                            try {
                              const response = await fetch(`/api/admin/properties/${property.id}/interview/complete`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  notes: property.interviewNotes,
                                  status: 'COMPLETED'
                                })
                              })
                              if (response.ok) await fetchPropertyDetails()
                            } catch (error) {
                              setError('Failed to complete interview')
                            } finally {
                              setIsProcessing(false)
                            }
                          }}
                          disabled={isProcessing}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {isProcessing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Mark Interview Complete
                        </Button>
                      </div>
                    )}

                    {property.interviewStatus === 'COMPLETED' && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                          Interview completed. Property is ready for final approval decision.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Schedule Interview Dialog */}
        <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Property Interview</DialogTitle>
              <DialogDescription>
                Set up an interview with the seller for property {property.code}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="interviewDate">Interview Date</Label>
                <Input
                  id="interviewDate"
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="interviewTime">Interview Time</Label>
                <Input
                  id="interviewTime"
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                />
              </div>
              <Button
                onClick={handleScheduleInterview}
                disabled={isProcessing || !interviewDate || !interviewTime}
                className="w-full"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CalendarPlus className="mr-2 h-4 w-4" />
                )}
                Schedule & Create Calendar Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Audit Dialog */}
        <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Property Audit</DialogTitle>
              <DialogDescription>
                Create an audit record for property {property.code}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="auditNotes">Audit Notes</Label>
                <Textarea
                  id="auditNotes"
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Enter audit observations..."
                  rows={5}
                />
              </div>
              <Button
                onClick={handleCreateAudit}
                disabled={isProcessing || !auditNotes.trim()}
                className="w-full"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ClipboardList className="mr-2 h-4 w-4" />
                )}
                Create Audit Record
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}