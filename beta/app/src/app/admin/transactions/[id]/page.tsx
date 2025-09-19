'use client'

import { use, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Home,
  User,
  FileText,
  Calendar,
  Euro,
  Clock,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  Shield,
  CreditCard
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Transaction {
  id: string
  propertyId: string
  status: string
  offerPrice: string
  agreedPrice?: string
  offerMessage?: string
  offerTerms?: string
  paymentMethod: string
  cryptoPercentage?: number
  fiatPercentage?: number
  createdAt: string
  updatedAt: string
  proposalDate?: string
  acceptanceDate?: string
  escrowDate?: string
  completionDate?: string
  buyerSignedPromissory?: boolean
  sellerSignedPromissory?: boolean
  buyerSignedMediation?: boolean
  sellerSignedMediation?: boolean
  buyerKyc2Verified?: boolean
  sellerKyc2Verified?: boolean
  property: {
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
    complianceStatus: string
  }
  buyer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    kycStatus?: string
  }
  seller: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    kycStatus?: string
  }
  documents: Array<{
    id: string
    documentType: string
    filename: string
    originalName: string
    fileUrl: string
    uploadedAt: string
    user?: {
      email: string
      firstName?: string
      lastName?: string
    }
  }>
  counterOffers: Array<{
    id: string
    price: string
    message?: string
    terms?: string
    fromBuyer: boolean
    accepted: boolean
    rejected: boolean
    createdAt: string
  }>
  statusHistory: Array<{
    id: string
    fromStatus?: string
    toStatus: string
    changedBy?: string
    notes?: string
    createdAt: string
  }>
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AdminTransactionDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/signin')
      return
    }

    fetchTransaction()
  }, [session, status, id])

  const fetchTransaction = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch(`/api/transactions/${id}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Transaction not found')
        } else {
          throw new Error('Failed to fetch transaction')
        }
        return
      }

      const data = await response.json()
      setTransaction(data.transaction)

    } catch (error) {
      console.error('Error fetching transaction:', error)
      setError('Failed to load transaction details')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(price))
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a')
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'OFFER': 'bg-blue-100 text-blue-800',
      'NEGOTIATION': 'bg-yellow-100 text-yellow-800',
      'AGREEMENT': 'bg-purple-100 text-purple-800',
      'KYC2_VERIFICATION': 'bg-indigo-100 text-indigo-800',
      'FUND_PROTECTION': 'bg-green-100 text-green-800',
      'CLOSING': 'bg-orange-100 text-orange-800',
      'COMPLETED': 'bg-green-500 text-white',
      'FAILED': 'bg-red-100 text-red-800'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  const getDocumentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'REPRESENTATION_DOCUMENT': 'bg-purple-100 text-purple-800',
      'MEDIATION_AGREEMENT': 'bg-blue-100 text-blue-800',
      'PURCHASE_AGREEMENT': 'bg-green-100 text-green-800',
      'PROOF_OF_PAYMENT': 'bg-yellow-100 text-yellow-800',
      'CONTRACT': 'bg-indigo-100 text-indigo-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-red-500 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error</h2>
                <p>{error}</p>
                <Button
                  onClick={() => router.push('/admin?tab=transactions')}
                  className="mt-4"
                >
                  Back to Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!transaction) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/admin?tab=transactions')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transactions
          </Button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Transaction Details
              </h1>
              <p className="text-gray-600">
                Transaction ID: {transaction.id}
              </p>
            </div>
            <Badge className={`text-lg px-4 py-2 ${getStatusBadge(transaction.status)}`}>
              {transaction.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Property & Financial */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Property Code</p>
                    <p className="font-semibold">{transaction.property.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Title</p>
                    <p className="font-semibold">{transaction.property.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-semibold">{transaction.property.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-semibold">{transaction.property.city}, {transaction.property.country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Listed Price</p>
                    <p className="font-semibold text-lg">{formatPrice(transaction.property.price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Compliance Status</p>
                    <Badge variant="outline">{transaction.property.complianceStatus}</Badge>
                  </div>
                  {transaction.property.area && (
                    <div>
                      <p className="text-sm text-gray-500">Area</p>
                      <p className="font-semibold">{transaction.property.area} m²</p>
                    </div>
                  )}
                  {transaction.property.bedrooms && (
                    <div>
                      <p className="text-sm text-gray-500">Bedrooms/Bathrooms</p>
                      <p className="font-semibold">{transaction.property.bedrooms} / {transaction.property.bathrooms}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Euro className="h-5 w-5 mr-2" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Initial Offer</p>
                      <p className="font-semibold text-xl text-blue-600">{formatPrice(transaction.offerPrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Agreed Price</p>
                      <p className="font-semibold text-xl text-green-600">
                        {transaction.agreedPrice ? formatPrice(transaction.agreedPrice) : 'Not yet agreed'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <Badge variant="outline">{transaction.paymentMethod}</Badge>
                    </div>
                    {transaction.paymentMethod === 'HYBRID' && (
                      <div>
                        <p className="text-sm text-gray-500">Split</p>
                        <p className="font-semibold">
                          Fiat: {transaction.fiatPercentage}% / Crypto: {transaction.cryptoPercentage}%
                        </p>
                      </div>
                    )}
                  </div>
                  {transaction.offerMessage && (
                    <div>
                      <p className="text-sm text-gray-500">Offer Message</p>
                      <p className="mt-1 p-3 bg-gray-50 rounded">{transaction.offerMessage}</p>
                    </div>
                  )}
                  {transaction.offerTerms && (
                    <div>
                      <p className="text-sm text-gray-500">Terms</p>
                      <p className="mt-1 p-3 bg-gray-50 rounded">{transaction.offerTerms}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Documents ({transaction.documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transaction.documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-3">
                    {transaction.documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{doc.originalName}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge className={`text-xs ${getDocumentTypeBadge(doc.documentType)}`}>
                              {doc.documentType.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Uploaded by {doc.user?.email || 'Unknown'} on {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Parties & Status */}
          <div className="space-y-6">
            {/* Buyer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <User className="h-5 w-5 mr-2" />
                  Buyer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold">
                    {transaction.buyer.firstName} {transaction.buyer.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{transaction.buyer.email}</p>
                  {transaction.buyer.phone && (
                    <p className="text-sm text-gray-600">{transaction.buyer.phone}</p>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">KYC Status</p>
                    <Badge variant="outline" className="mt-1">
                      {transaction.buyer.kycStatus || 'NOT_STARTED'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <User className="h-5 w-5 mr-2" />
                  Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold">
                    {transaction.seller.firstName} {transaction.seller.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{transaction.seller.email}</p>
                  {transaction.seller.phone && (
                    <p className="text-sm text-gray-600">{transaction.seller.phone}</p>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">KYC Status</p>
                    <Badge variant="outline" className="mt-1">
                      {transaction.seller.kycStatus || 'NOT_STARTED'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agreements Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Agreements Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Promissory Agreement</span>
                    <div className="flex gap-2">
                      {transaction.buyerSignedPromissory ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                      <span className="text-xs">Buyer</span>
                      {transaction.sellerSignedPromissory ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                      <span className="text-xs">Seller</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mediation Agreement</span>
                    <div className="flex gap-2">
                      {transaction.buyerSignedMediation ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                      <span className="text-xs">Buyer</span>
                      {transaction.sellerSignedMediation ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                      <span className="text-xs">Seller</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">KYC2 Verification</span>
                    <div className="flex gap-2">
                      {transaction.buyerKyc2Verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                      <span className="text-xs">Buyer</span>
                      {transaction.sellerKyc2Verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                      <span className="text-xs">Seller</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm">{formatDate(transaction.createdAt)}</p>
                  </div>
                  {transaction.proposalDate && (
                    <div>
                      <p className="text-xs text-gray-500">Proposal Date</p>
                      <p className="text-sm">{formatDate(transaction.proposalDate)}</p>
                    </div>
                  )}
                  {transaction.acceptanceDate && (
                    <div>
                      <p className="text-xs text-gray-500">Acceptance Date</p>
                      <p className="text-sm">{formatDate(transaction.acceptanceDate)}</p>
                    </div>
                  )}
                  {transaction.escrowDate && (
                    <div>
                      <p className="text-xs text-gray-500">Escrow Date</p>
                      <p className="text-sm">{formatDate(transaction.escrowDate)}</p>
                    </div>
                  )}
                  {transaction.completionDate && (
                    <div>
                      <p className="text-xs text-gray-500">Completion Date</p>
                      <p className="text-sm">{formatDate(transaction.completionDate)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status History & Counter Offers Tabs */}
        <Card className="mt-6">
          <CardContent className="p-0">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history">Status History</TabsTrigger>
                <TabsTrigger value="offers">Counter Offers</TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="p-6">
                <div className="space-y-3">
                  {transaction.statusHistory.map((history) => (
                    <div key={history.id} className="border-l-2 border-gray-200 pl-4 pb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{history.toStatus}</Badge>
                        {history.fromStatus && (
                          <>
                            <span className="text-sm text-gray-500">from</span>
                            <Badge variant="outline">{history.fromStatus}</Badge>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(history.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                      {history.notes && (
                        <p className="text-sm mt-1">{history.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="offers" className="p-6">
                {transaction.counterOffers.length === 0 ? (
                  <p className="text-gray-500 text-center">No counter offers made</p>
                ) : (
                  <div className="space-y-3">
                    {transaction.counterOffers.map((offer) => (
                      <div key={offer.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{formatPrice(offer.price)}</p>
                            <p className="text-sm text-gray-500">
                              From {offer.fromBuyer ? 'Buyer' : 'Seller'} • {format(new Date(offer.createdAt), 'MMM d, yyyy')}
                            </p>
                            {offer.message && (
                              <p className="text-sm mt-2">{offer.message}</p>
                            )}
                          </div>
                          <div>
                            {offer.accepted && (
                              <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                            )}
                            {offer.rejected && (
                              <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}