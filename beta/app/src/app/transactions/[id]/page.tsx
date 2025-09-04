'use client'

import { use, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import DocumentManager from '@/components/documents/document-manager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft,
  Euro,
  Calendar,
  MapPin,
  User,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Home,
  FileText,
  CreditCard,
  Shield,
  ArrowRight,
  Download
} from 'lucide-react'

interface Transaction {
  id: string
  propertyId: string
  status: string
  offerPrice: string
  agreedPrice?: string
  offerMessage?: string
  offerTerms?: string
  proposalDate?: string
  acceptanceDate?: string
  escrowDate?: string
  completionDate?: string
  createdAt: string
  updatedAt: string
  userRole: 'buyer' | 'seller'
  buyerHasRep: boolean
  sellerHasRep: boolean
  mediationSigned: boolean
  purchaseAgreementSigned: boolean
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
    createdAt: string
  }
  buyer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  seller: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
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
  escrowDetails?: {
    totalAmount: string
    initialDeposit?: string
    finalPayment?: string
    escrowProvider?: string
    releaseConditions?: string
    fundsReceived: boolean
    fundsReleased: boolean
    fundingDate?: string
    releaseDate?: string
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TransactionDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isResponding, setIsResponding] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false)
  const [responseForm, setResponseForm] = useState({
    action: '',
    counterPrice: '',
    message: '',
    terms: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
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
        } else if (response.status === 403) {
          setError('You are not authorized to view this transaction')
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

  const handleResponse = async () => {
    if (!transaction || !session?.user || !responseForm.action) return
    
    if (responseForm.action === 'counter' && (!responseForm.counterPrice || parseFloat(responseForm.counterPrice) <= 0)) {
      setError('Please enter a valid counter offer price')
      return
    }
    
    setIsResponding(true)
    setError('')
    
    try {
      const response = await fetch(`/api/transactions/${id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: responseForm.action,
          counterPrice: responseForm.counterPrice || undefined,
          message: responseForm.message || undefined,
          terms: responseForm.terms || undefined
        })
      })

      if (response.ok) {
        setIsResponseDialogOpen(false)
        setResponseForm({ action: '', counterPrice: '', message: '', terms: '' })
        fetchTransaction() // Refresh transaction data
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to respond to transaction')
      }
    } catch (error) {
      console.error('Error responding to transaction:', error)
      setError('Failed to respond to transaction')
    } finally {
      setIsResponding(false)
    }
  }

  const handleAdvanceStage = async () => {
    if (!transaction || !session?.user) return
    
    setIsAdvancing(true)
    setError('')
    
    try {
      const response = await fetch(`/api/transactions/${id}/advance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: `Advanced by ${session.user.firstName} ${session.user.lastName}`
        })
      })

      if (response.ok) {
        fetchTransaction() // Refresh transaction data
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to advance transaction')
      }
    } catch (error) {
      console.error('Error advancing transaction:', error)
      setError('Failed to advance transaction')
    } finally {
      setIsAdvancing(false)
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
    return new Date(dateString).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const downloadAgreement = async () => {
    try {
      const response = await fetch(`/api/transactions/${id}/agreement-pdf`)
      
      if (response.ok) {
        const html = await response.text()
        const blob = new Blob([html], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `agreement-${transaction?.property.code || 'document'}.html`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate agreement')
      }
    } catch (error) {
      console.error('Error downloading agreement:', error)
      alert('Failed to download agreement')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; icon: React.ReactNode } } = {
      'OFFER': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3 h-3" /> },
      'NEGOTIATION': { color: 'bg-orange-100 text-orange-800', icon: <MessageSquare className="w-3 h-3" /> },
      'AGREEMENT': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      'ESCROW': { color: 'bg-purple-100 text-purple-800', icon: <TrendingUp className="w-3 h-3" /> },
      'CLOSING': { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-3 h-3" /> },
      'COMPLETED': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      'CANCELLED': { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> }
    }
    
    const config = statusConfig[status] || statusConfig['OFFER']
    
    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        {config.icon}
        <span className="ml-1">{status}</span>
      </Badge>
    )
  }

  const canRespond = () => {
    return transaction?.userRole === 'seller' && 
           ['OFFER', 'NEGOTIATION'].includes(transaction.status)
  }

  const canAdvance = () => {
    const advanceable = ['AGREEMENT', 'ESCROW', 'CLOSING']
    return transaction && advanceable.includes(transaction.status)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading transaction details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="outline"
            onClick={() => router.push('/transactions')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Transactions
          </Button>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Transaction not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={() => router.push('/transactions')}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transactions
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
              <p className="text-gray-600 mt-1">
                {transaction.userRole === 'buyer' ? 'Your offer on' : 'Offer received for'} {transaction.property.title}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(transaction.status)}
            <Badge variant="outline">
              {transaction.userRole === 'buyer' ? 'Buying' : 'Selling'}
            </Badge>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="mr-2 h-5 w-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{transaction.property.title}</h3>
                    <p className="text-sm text-gray-600 font-mono">{transaction.property.code}</p>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{transaction.property.address}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.property.city}
                        {transaction.property.state && `, ${transaction.property.state}`}
                        {` ${transaction.property.postalCode}, ${transaction.property.country}`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Euro className="h-5 w-5 mx-auto mb-1 text-green-600" />
                      <div className="text-sm font-bold">{formatPrice(transaction.property.price)}</div>
                      <div className="text-xs text-gray-500">Asking Price</div>
                    </div>
                    
                    {transaction.property.area && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-bold">{transaction.property.area}m²</div>
                        <div className="text-xs text-gray-500">Area</div>
                      </div>
                    )}
                    
                    {transaction.property.bedrooms && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-bold">{transaction.property.bedrooms}</div>
                        <div className="text-xs text-gray-500">Bedrooms</div>
                      </div>
                    )}
                    
                    {transaction.property.bathrooms && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-bold">{transaction.property.bathrooms}</div>
                        <div className="text-xs text-gray-500">Bathrooms</div>
                      </div>
                    )}
                  </div>

                  {transaction.property.description && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {transaction.property.description}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Offer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Euro className="mr-2 h-5 w-5" />
                  Offer Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Initial Offer</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice(transaction.offerPrice)}
                    </div>
                  </div>
                  
                  {transaction.agreedPrice && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Agreed Price</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(transaction.agreedPrice)}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Offer Date</div>
                    <div className="font-medium">
                      {transaction.proposalDate ? formatDate(transaction.proposalDate) : formatDate(transaction.createdAt)}
                    </div>
                  </div>
                  
                  {transaction.acceptanceDate && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Acceptance Date</div>
                      <div className="font-medium">
                        {formatDate(transaction.acceptanceDate)}
                      </div>
                    </div>
                  )}
                </div>

                {transaction.offerMessage && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Buyer's Message:</div>
                    <div className="text-sm">{transaction.offerMessage}</div>
                  </div>
                )}

                {transaction.offerTerms && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Special Terms:</div>
                    <div className="text-sm">{transaction.offerTerms}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Counter Offers */}
            {transaction.counterOffers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Negotiation History ({transaction.counterOffers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transaction.counterOffers.map((offer, index) => (
                      <div key={offer.id} className={`p-4 rounded-lg border ${
                        offer.fromBuyer ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Badge variant={offer.fromBuyer ? "default" : "secondary"}>
                              {offer.fromBuyer ? 'Buyer' : 'Seller'} Counter Offer
                            </Badge>
                            <span className="ml-2 text-sm text-gray-600">
                              {formatDate(offer.createdAt)}
                            </span>
                          </div>
                          <div className="text-lg font-bold">
                            {formatPrice(offer.price)}
                          </div>
                        </div>
                        
                        {offer.message && (
                          <div className="text-sm text-gray-700 mt-2">
                            <strong>Message:</strong> {offer.message}
                          </div>
                        )}
                        
                        {offer.terms && (
                          <div className="text-sm text-gray-700 mt-1">
                            <strong>Terms:</strong> {offer.terms}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transaction.statusHistory.map((history, index) => (
                    <div key={history.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusBadge(history.toStatus)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm">
                          {history.fromStatus ? `Changed from ${history.fromStatus} to ${history.toStatus}` : `Set to ${history.toStatus}`}
                        </div>
                        {history.notes && (
                          <div className="text-xs text-gray-600 mt-1">{history.notes}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(history.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canRespond() && (
                  <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Respond to Offer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Respond to Offer</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>Your Response</Label>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <Button
                              variant={responseForm.action === 'accept' ? 'default' : 'outline'}
                              onClick={() => setResponseForm(prev => ({ ...prev, action: 'accept' }))}
                              className="text-sm"
                            >
                              Accept
                            </Button>
                            <Button
                              variant={responseForm.action === 'counter' ? 'default' : 'outline'}
                              onClick={() => setResponseForm(prev => ({ ...prev, action: 'counter' }))}
                              className="text-sm"
                            >
                              Counter
                            </Button>
                            <Button
                              variant={responseForm.action === 'reject' ? 'destructive' : 'outline'}
                              onClick={() => setResponseForm(prev => ({ ...prev, action: 'reject' }))}
                              className="text-sm"
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                        
                        {responseForm.action === 'counter' && (
                          <div>
                            <Label htmlFor="counter-price">Counter Offer Price (EUR)</Label>
                            <Input
                              id="counter-price"
                              type="number"
                              min="1"
                              step="1000"
                              placeholder="Enter your counter offer"
                              value={responseForm.counterPrice}
                              onChange={(e) => setResponseForm(prev => ({ ...prev, counterPrice: e.target.value }))}
                            />
                          </div>
                        )}
                        
                        <div>
                          <Label htmlFor="response-message">Message (Optional)</Label>
                          <Textarea
                            id="response-message"
                            placeholder="Add a message to explain your response..."
                            value={responseForm.message}
                            onChange={(e) => setResponseForm(prev => ({ ...prev, message: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        
                        {responseForm.action === 'counter' && (
                          <div>
                            <Label htmlFor="response-terms">Additional Terms (Optional)</Label>
                            <Textarea
                              id="response-terms"
                              placeholder="Any additional terms or conditions..."
                              value={responseForm.terms}
                              onChange={(e) => setResponseForm(prev => ({ ...prev, terms: e.target.value }))}
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsResponseDialogOpen(false)
                            setResponseForm({ action: '', counterPrice: '', message: '', terms: '' })
                            setError('')
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleResponse}
                          disabled={isResponding || !responseForm.action}
                        >
                          {isResponding ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Response'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {canAdvance() && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleAdvanceStage}
                    disabled={isAdvancing}
                  >
                    {isAdvancing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Advancing...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Advance Stage
                      </>
                    )}
                  </Button>
                )}

                {transaction && ['AGREEMENT', 'ESCROW', 'CLOSING', 'COMPLETED'].includes(transaction.status) && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={downloadAgreement}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Agreement
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/property/${transaction.property.code}`)}
                >
                  <Home className="mr-2 h-4 w-4" />
                  View Property
                </Button>
              </CardContent>
            </Card>

            {/* Parties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Parties Involved
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Buyer</div>
                  <div className="font-medium">
                    {transaction.buyer.firstName} {transaction.buyer.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {transaction.buyer.email}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Seller</div>
                  <div className="font-medium">
                    {transaction.seller.firstName} {transaction.seller.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {transaction.seller.email}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Escrow Details */}
            {transaction.escrowDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    Escrow Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Total Amount</div>
                    <div className="text-lg font-bold">
                      {formatPrice(transaction.escrowDetails.totalAmount)}
                    </div>
                  </div>
                  
                  {transaction.escrowDetails.escrowProvider && (
                    <div>
                      <div className="text-sm text-gray-600">Provider</div>
                      <div className="font-medium">{transaction.escrowDetails.escrowProvider}</div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className={`flex items-center text-sm ${transaction.escrowDetails.fundsReceived ? 'text-green-600' : 'text-gray-500'}`}>
                      {transaction.escrowDetails.fundsReceived ? <CheckCircle className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                      Funds Received
                    </div>
                    <div className={`flex items-center text-sm ${transaction.escrowDetails.fundsReleased ? 'text-green-600' : 'text-gray-500'}`}>
                      {transaction.escrowDetails.fundsReleased ? <CheckCircle className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                      Funds Released
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document Management */}
            <DocumentManager
              entityId={transaction.id}
              entityType="transaction"
              currentUserId={session.user.id}
              userRole={session.user.role}
              canUpload={
                session.user.role === 'ADMIN' || 
                transaction.buyerId === session.user.id || 
                transaction.sellerId === session.user.id
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}