'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentAccessManager } from '@/components/seller/document-access-manager'
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Calendar,
  Edit,
  Trash2,
  Users,
  FileText,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
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

interface Property {
  id: string
  code: string
  title: string
  description: string
  price: number
  propertyType: string
  listingStatus: string
  complianceStatus: string
  bedrooms: number
  bathrooms: number
  area: number
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  yearBuilt: number
  features: string[]
  images: string[]
  createdAt: string
  updatedAt: string
  interestCount?: number
  transactionCount?: number
  interviewCompleted?: boolean
}

export default function PropertyManagementPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [transactions, setTransactions] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [interests, setInterests] = useState<any[]>([])
  const [isLoadingInterests, setIsLoadingInterests] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'SELLER') {
      router.push('/auth/signin')
      return
    }
    fetchPropertyDetails()
    fetchPropertyTransactions()
    fetchPropertyDocuments()
    fetchPropertyInterests()
  }, [session, status, id])

  const fetchPropertyDetails = async () => {
    try {
      setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPropertyTransactions = async () => {
    try {
      const response = await fetch(`/api/transactions?propertyId=${id}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const fetchPropertyDocuments = async () => {
    try {
      setIsLoadingDocuments(true)
      const response = await fetch(`/api/properties/${id}/documents/upload`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const fetchPropertyInterests = async () => {
    try {
      setIsLoadingInterests(true)
      const response = await fetch(`/api/properties/${id}/interests`)
      if (response.ok) {
        const data = await response.json()
        setInterests(data.interests || [])
      }
    } catch (error) {
      console.error('Error fetching interests:', error)
    } finally {
      setIsLoadingInterests(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/seller/properties')
      } else {
        setError('Failed to delete property')
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      setError('Failed to delete property')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingStatus: newStatus })
      })

      if (response.ok) {
        const data = await response.json()
        setProperty(data.property)
      } else {
        setError('Failed to update property status')
      }
    } catch (error) {
      console.error('Error updating property:', error)
      setError('Failed to update property status')
    }
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

  const statusColor = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    SOLD: 'bg-gray-100 text-gray-800',
    WITHDRAWN: 'bg-red-100 text-red-800'
  }

  const complianceColor = {
    APPROVED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    REJECTED: 'bg-red-100 text-red-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/seller/properties')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Manage Property</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/property/${property.code}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Public Listing
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="mr-2 h-4 w-4" />
              {isEditing ? 'Cancel Edit' : 'Edit'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={transactions.length > 0}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the property
                    and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Property'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Property Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{property.title}</CardTitle>
                    <CardDescription className="mt-1">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      {property.address}, {property.city}, {property.state} {property.postalCode}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">€{property.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Property ID: {property.code}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center">
                    <Bed className="h-5 w-5 text-gray-400 mr-2" />
                    <span>{property.bedrooms} Bedrooms</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-5 w-5 text-gray-400 mr-2" />
                    <span>{property.bathrooms} Bathrooms</span>
                  </div>
                  <div className="flex items-center">
                    <Square className="h-5 w-5 text-gray-400 mr-2" />
                    <span>{property.area} m²</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <span>Built {property.yearBuilt}</span>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{property.description}</p>
                </div>

                {property.features && property.features.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((feature, index) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Images */}
            {property.images && property.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Property Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Property image ${index + 1}`}
                        className="rounded-lg object-cover w-full h-40"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Activity</CardTitle>
                <CardDescription>
                  {transactions.length} active transaction{transactions.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">
                                Offer from {transaction.buyer?.firstName || ''} {transaction.buyer?.lastName || transaction.buyer?.email}
                              </p>
                              <Badge className={
                                transaction.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                transaction.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                transaction.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {transaction.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Offer: €{Number(transaction.offerPrice).toLocaleString()}
                            </p>
                            {transaction.offerMessage && (
                              <p className="text-sm text-gray-500 mt-1 italic">
                                "{transaction.offerMessage}"
                              </p>
                            )}
                            {transaction.counterOffersCount > 0 && (
                              <p className="text-sm text-blue-600 mt-1">
                                {transaction.counterOffersCount} counter offer{transaction.counterOffersCount !== 1 ? 's' : ''}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Submitted {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/transactions/${transaction.id}`)}
                            className="ml-4"
                          >
                            Manage Offer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No transactions yet. When buyers make offers, they will appear here.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Property Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Property Interests</span>
                  <Users className="h-5 w-5 text-gray-400" />
                </CardTitle>
                <CardDescription>
                  {interests.length} {interests.length === 1 ? 'person has' : 'people have'} expressed interest
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingInterests ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading interests...</span>
                  </div>
                ) : interests.length > 0 ? (
                  <div className="space-y-4">
                    {interests.map((interest) => (
                      <div key={interest.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900">
                                {interest.buyerName}
                              </p>
                              <Badge 
                                variant="outline" 
                                className={
                                  interest.buyerKycStatus === 'PASSED' 
                                    ? 'bg-green-50 text-green-700 border-green-300'
                                    : interest.buyerKycStatus === 'PENDING'
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                    : 'bg-gray-50 text-gray-700 border-gray-300'
                                }
                              >
                                {interest.buyerKycStatus === 'PASSED' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {interest.buyerKycStatus === 'PENDING' && <AlertCircle className="h-3 w-3 mr-1" />}
                                KYC {interest.buyerKycStatus}
                              </Badge>
                            </div>
                            <div className="mt-1 space-y-1">
                              <p className="text-sm text-gray-600">
                                {interest.buyerEmail}
                              </p>
                              {interest.buyerPhone && (
                                <p className="text-sm text-gray-600">
                                  {interest.buyerPhone}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                Interested since {new Date(interest.interestedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="text-xs text-gray-400">
                                Member since {new Date(interest.buyerSince).toLocaleDateString()}
                              </p>
                            </div>
                            {interest.message && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-700 italic">"{interest.message}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No one has expressed interest yet.
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      When buyers show interest in your property, they will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card - Enhanced */}
            <Card>
              <CardHeader>
                <CardTitle>Property Status & Approval Process</CardTitle>
                <CardDescription>Track your property through the approval stages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Status */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Current Stage:</span>
                    {(() => {
                      // Check if all documents are uploaded
                      const hasAllDocuments = documents && documents.filter(doc => 
                        ['COMPLIANCE_DECLARATION', 'ENERGY_CERTIFICATE', 'MUNICIPAL_LICENSE', 
                         'PREDIAL_REGISTRATION', 'CADERNETA_PREDIAL_URBANA'].includes(doc.type)
                      ).length >= 5;
                      
                      if (property.complianceStatus === 'APPROVED') {
                        return <Badge className="bg-green-100 text-green-800">✅ Approved - Ready to List</Badge>
                      } else if (property.complianceStatus === 'REJECTED') {
                        return <Badge className="bg-red-100 text-red-800">❌ Rejected - Action Required</Badge>
                      } else if (property.interviewCompleted) {
                        return <Badge className="bg-purple-100 text-purple-800">🎯 Final Review</Badge>
                      } else if (hasAllDocuments) {
                        return <Badge className="bg-blue-100 text-blue-800">📋 Under Review (24h)</Badge>
                      } else {
                        return <Badge className="bg-amber-100 text-amber-800">📄 Awaiting Documents</Badge>
                      }
                    })()}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {property.complianceStatus === 'APPROVED' ? 
                      'Your property is approved and visible to buyers!' :
                     property.complianceStatus === 'REJECTED' ?
                      'Please review compliance notes and resubmit documents.' :
                     property.interviewCompleted ?
                      'Interview completed. Final approval pending.' :
                     documents && documents.filter(doc => 
                       ['COMPLIANCE_DECLARATION', 'ENERGY_CERTIFICATE', 'MUNICIPAL_LICENSE', 
                        'PREDIAL_REGISTRATION', 'CADERNETA_PREDIAL_URBANA'].includes(doc.type)
                     ).length >= 5 ?
                      'All documents submitted. Review in progress (24 hours). Interview will be scheduled after document approval.' :
                      'Upload all required documents to start the approval process.'}
                  </div>
                </div>

                {/* Approval Process Steps */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Approval Process Steps:</p>
                  <div className="space-y-2">
                    {/* Step 1 */}
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        property.complianceStatus !== 'PENDING' || (documents && documents.length > 0) ? 
                        'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {property.complianceStatus !== 'PENDING' || (documents && documents.length > 0) ? '✓' : '1'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Upload Required Documents</p>
                        <p className="text-xs text-gray-500">5 mandatory documents needed</p>
                      </div>
                      {documents && documents.filter(doc => 
                        ['COMPLIANCE_DECLARATION', 'ENERGY_CERTIFICATE', 'MUNICIPAL_LICENSE', 
                         'PREDIAL_REGISTRATION', 'CADERNETA_PREDIAL_URBANA'].includes(doc.type)
                      ).length < 5 && (
                        <Button size="sm" variant="outline" onClick={() => router.push(`/seller/properties/${property.id}/documents`)}>
                          Upload
                        </Button>
                      )}
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        property.complianceStatus === 'APPROVED' || property.complianceStatus === 'REJECTED' || 
                        (property.complianceStatus === 'PENDING' && property.interviewCompleted) ? 
                        'bg-green-500 text-white' : 
                        documents && documents.filter(doc => 
                          ['COMPLIANCE_DECLARATION', 'ENERGY_CERTIFICATE', 'MUNICIPAL_LICENSE', 
                           'PREDIAL_REGISTRATION', 'CADERNETA_PREDIAL_URBANA'].includes(doc.type)
                        ).length >= 5 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {property.complianceStatus === 'APPROVED' || property.complianceStatus === 'REJECTED' || 
                         (property.complianceStatus === 'PENDING' && property.interviewCompleted) ? '✓' : '2'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Compliance Review</p>
                        <p className="text-xs text-gray-500">24-hour review period</p>
                      </div>
                      {documents && documents.filter(doc => 
                        ['COMPLIANCE_DECLARATION', 'ENERGY_CERTIFICATE', 'MUNICIPAL_LICENSE', 
                         'PREDIAL_REGISTRATION', 'CADERNETA_PREDIAL_URBANA'].includes(doc.type)
                      ).length >= 5 && property.complianceStatus === 'PENDING' && !property.interviewCompleted && (
                        <Badge variant="outline" className="text-blue-600">In Progress</Badge>
                      )}
                    </div>

                    {/* Step 3 - Interview */}
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        property.complianceStatus === 'APPROVED' || 
                        (property.complianceStatus === 'PENDING' && property.interviewCompleted) ? 
                        'bg-green-500 text-white' : 
                        property.complianceStatus === 'PENDING' && documents && documents.filter(doc => 
                          ['COMPLIANCE_DECLARATION', 'ENERGY_CERTIFICATE', 'MUNICIPAL_LICENSE', 
                           'PREDIAL_REGISTRATION', 'CADERNETA_PREDIAL_URBANA'].includes(doc.type)
                        ).length >= 5 ? 'bg-amber-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {property.complianceStatus === 'APPROVED' || 
                         (property.complianceStatus === 'PENDING' && property.interviewCompleted) ? '✓' : '3'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Interview</p>
                        <p className="text-xs text-gray-500">Video call with compliance team</p>
                      </div>
                      {property.complianceStatus === 'PENDING' && !property.interviewCompleted && 
                       documents && documents.filter(doc => 
                        ['COMPLIANCE_DECLARATION', 'ENERGY_CERTIFICATE', 'MUNICIPAL_LICENSE', 
                         'PREDIAL_REGISTRATION', 'CADERNETA_PREDIAL_URBANA'].includes(doc.type)
                      ).length >= 5 && (
                        <Badge variant="outline" className="text-amber-600">Pending</Badge>
                      )}
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        property.complianceStatus === 'APPROVED' ? 
                        'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {property.complianceStatus === 'APPROVED' ? '✓' : '4'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Property Approved</p>
                        <p className="text-xs text-gray-500">Listed and visible to buyers</p>
                      </div>
                      {property.complianceStatus === 'APPROVED' && (
                        <Badge variant="outline" className="text-green-600">Complete</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compliance Notes if Rejected */}
                {property.complianceStatus === 'REJECTED' && property.complianceNotes && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Compliance Issue:</strong> {property.complianceNotes}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Support Info */}
                {property.complianceStatus === 'PENDING' && documents && documents.filter(doc => 
                  ['COMPLIANCE_DECLARATION', 'ENERGY_CERTIFICATE', 'MUNICIPAL_LICENSE', 
                   'PREDIAL_REGISTRATION', 'CADERNETA_PREDIAL_URBANA'].includes(doc.type)
                ).length >= 5 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      If you don't receive a response within 24 hours, contact{' '}
                      <a href="mailto:support@caenhebo.com" className="underline">support@caenhebo.com</a>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-4 space-y-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Views</span>
                    <span className="text-sm font-medium">
                      {property.interestCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Offers</span>
                    <span className="text-sm font-medium">
                      {property.transactionCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Listed</span>
                    <span className="text-sm font-medium">
                      {new Date(property.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium">
                      {new Date(property.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/seller/properties/${property.id}/documents`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/seller/properties/${property.id}/analytics`)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            {/* Document Access Control */}
            {property.complianceStatus === 'APPROVED' && (
              <DocumentAccessManager 
                propertyId={property.id} 
                propertyCode={property.code}
              />
            )}

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>Contact our support team for assistance with your listing:</p>
                <p className="mt-2">
                  Email: <a href="mailto:support@caenhebo.com" className="text-blue-600 hover:underline">support@caenhebo.com</a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}