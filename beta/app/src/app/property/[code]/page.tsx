'use client'

import { use, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import DocumentManager from '@/components/documents/document-manager'
import { PropertyDocuments } from '@/components/buyer/property-documents'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  ArrowLeft, 
  MapPin, 
  Euro, 
  Home as HomeIcon, 
  Bath, 
  Bed, 
  Square, 
  Calendar,
  Heart,
  MessageSquare,
  Shield,
  Loader2,
  AlertCircle,
  DollarSign,
  CreditCard
} from 'lucide-react'

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
  complianceStatus: string
  createdAt: string
  updatedAt: string
  interestCount: number
  transactionCount: number
  hasUserInterest?: boolean
  sellerId: string
}

interface PropertyTransaction {
  id: string
  buyerId: string
  status: string
  offerPrice: string
  agreedPrice?: string
  offerMessage?: string
  offerTerms?: string
  proposalDate?: string
  acceptanceDate?: string
  createdAt: string
  updatedAt: string
  needsSellerResponse: boolean
  buyer: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  latestCounterOffer?: {
    id: string
    price: string
    message?: string
    fromBuyer: boolean
    createdAt: string
  }
}

interface PageProps {
  params: Promise<{ code: string }>
}

export default function PropertyDetailPage({ params }: PageProps) {
  const { code } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isExpressingInterest, setIsExpressingInterest] = useState(false)
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false)
  const [isMakingOffer, setIsMakingOffer] = useState(false)
  const [offerForm, setOfferForm] = useState({
    price: '',
    message: '',
    terms: '',
    paymentMethod: 'FIAT' as 'FIAT' | 'CRYPTO' | 'HYBRID',
    cryptoPercentage: 50,
    fiatPercentage: 50
  })
  const [propertyTransactions, setPropertyTransactions] = useState<PropertyTransaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [buyerOffer, setBuyerOffer] = useState<PropertyTransaction | null>(null)
  const [userKyc2Status, setUserKyc2Status] = useState<string>('PENDING')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Set user KYC2 status from session
    setUserKyc2Status(session.user.kyc2Status || 'PENDING')

    fetchProperty()
  }, [session, status, code])

  useEffect(() => {
    if (property && session?.user.role === 'SELLER' && property.sellerId === session.user.id) {
      fetchPropertyTransactions()
    }
    // Check if buyer has an existing offer
    if (property && session?.user.role === 'BUYER') {
      checkBuyerOffer()
    }
  }, [property, session])

  const fetchProperty = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch(`/api/properties/search?code=${encodeURIComponent(code)}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Property not found')
        } else if (response.status === 400) {
          const errorData = await response.json()
          setError(errorData.error || 'Property not accessible')
        } else {
          throw new Error('Failed to fetch property')
        }
        return
      }

      const data = await response.json()
      
      if (data.properties && data.properties.length > 0) {
        setProperty(data.properties[0])
      } else {
        setError('Property not found or not approved for viewing')
      }
      
    } catch (error) {
      console.error('Error fetching property:', error)
      setError('Failed to load property details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExpressInterest = async () => {
    if (!property || !session?.user) return
    
    setIsExpressingInterest(true)
    try {
      const response = await fetch('/api/properties/interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyId: property.id
        })
      })

      if (response.ok) {
        // Refresh property data to update interest status
        fetchProperty()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to express interest')
      }
    } catch (error) {
      console.error('Error expressing interest:', error)
      setError('Failed to express interest')
    } finally {
      setIsExpressingInterest(false)
    }
  }

  const checkBuyerOffer = async () => {
    if (!property) return
    
    try {
      const response = await fetch(`/api/transactions?propertyId=${property.id}&role=buyer`)
      if (response.ok) {
        const data = await response.json()
        if (data.transactions && data.transactions.length > 0) {
          setBuyerOffer(data.transactions[0])
        }
      }
    } catch (error) {
      console.error('Error checking buyer offer:', error)
    }
  }

  const fetchPropertyTransactions = async () => {
    if (!property) return
    
    setIsLoadingTransactions(true)
    try {
      const response = await fetch(`/api/properties/${property.id}/transactions`)
      
      if (response.ok) {
        const data = await response.json()
        setPropertyTransactions(data.transactions)
      } else {
        console.error('Failed to fetch property transactions')
      }
    } catch (error) {
      console.error('Error fetching property transactions:', error)
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const handleMakeOffer = async () => {
    if (!property || !session?.user) return
    
    // Validate form
    if (!offerForm.price || parseFloat(offerForm.price) <= 0) {
      setError('Please enter a valid offer price')
      return
    }
    
    setIsMakingOffer(true)
    setError('')
    
    try {
      const response = await fetch('/api/transactions/create-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyId: property.id,
          offerPrice: parseFloat(offerForm.price),
          message: offerForm.message || null,
          terms: offerForm.terms || null,
          paymentMethod: offerForm.paymentMethod,
          cryptoPercentage: offerForm.paymentMethod === 'HYBRID' ? offerForm.cryptoPercentage : null,
          fiatPercentage: offerForm.paymentMethod === 'HYBRID' ? offerForm.fiatPercentage : null
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Close dialog and reset form
        setIsOfferDialogOpen(false)
        setOfferForm({ 
          price: '', 
          message: '', 
          terms: '',
          paymentMethod: 'FIAT',
          cryptoPercentage: 50,
          fiatPercentage: 50
        })
        
        // Show success message
        alert('Offer submitted successfully! You will be notified when the seller responds.')
        
        // Refresh property data
        fetchProperty()
        
        // Refresh transactions for seller
        if (session.user.role === 'SELLER' && property.sellerId === session.user.id) {
          fetchPropertyTransactions()
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit offer')
      }
    } catch (error) {
      console.error('Error making offer:', error)
      setError('Failed to submit offer')
    } finally {
      setIsMakingOffer(false)
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
    return new Date(dateString).toLocaleDateString('pt-PT')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; text: string } } = {
      'OFFER': { color: 'bg-blue-100 text-blue-800', text: 'New Offer' },
      'NEGOTIATION': { color: 'bg-orange-100 text-orange-800', text: 'Negotiating' },
      'AGREEMENT': { color: 'bg-green-100 text-green-800', text: 'Agreed' },
      'ESCROW': { color: 'bg-purple-100 text-purple-800', text: 'In Escrow' },
      'CLOSING': { color: 'bg-yellow-100 text-yellow-800', text: 'Closing' },
      'COMPLETED': { color: 'bg-green-100 text-green-800', text: 'Sold' },
      'CANCELLED': { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    }
    
    const config = statusConfig[status] || statusConfig['OFFER']
    
    return (
      <Badge className={`${config.color} hover:${config.color} text-xs`}>
        {config.text}
      </Badge>
    )
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading property details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Property not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Property Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{property.title}</CardTitle>
                    <CardDescription className="text-lg font-mono text-blue-600 mt-1">
                      {property.code}
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    {property.complianceStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Euro className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <div className="text-lg font-bold">{formatPrice(property.price)}</div>
                    <div className="text-xs text-gray-500">Price</div>
                  </div>
                  
                  {property.area && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Square className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <div className="text-lg font-bold">{property.area}m²</div>
                      <div className="text-xs text-gray-500">Area</div>
                    </div>
                  )}
                  
                  {property.bedrooms && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Bed className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <div className="text-lg font-bold">{property.bedrooms}</div>
                      <div className="text-xs text-gray-500">Bedrooms</div>
                    </div>
                  )}
                  
                  {property.bathrooms && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Bath className="h-6 w-6 mx-auto mb-2 text-cyan-600" />
                      <div className="text-lg font-bold">{property.bathrooms}</div>
                      <div className="text-xs text-gray-500">Bathrooms</div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{property.address}</p>
                      <p className="text-sm text-gray-600">
                        {property.city}
                        {property.state && `, ${property.state}`}
                        {` ${property.postalCode}, ${property.country}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Listed on {formatDate(property.createdAt)}
                    </span>
                  </div>
                </div>

                {property.description && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Description</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {property.description}
                    </p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-3">Property Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-900">{property.interestCount}</div>
                      <div className="text-sm text-blue-700">People Interested</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-900">{property.transactionCount}</div>
                      <div className="text-sm text-green-700">Offers Made</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Management Section - Only for Sellers and Admin */}
            {(session.user.role === 'ADMIN' || property.sellerId === session.user.id) && (
              <DocumentManager
                entityId={property.id}
                entityType="property"
                currentUserId={session.user.id}
                userRole={session.user.role}
                canUpload={
                  session.user.role === 'ADMIN' || 
                  property.sellerId === session.user.id
                }
              />
            )}
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Verified Property
                </CardTitle>
                <CardDescription>
                  This property has passed compliance verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {session.user.role === 'BUYER' && (
                  <>
                    {/* Grandma-friendly: Show clear guidance if offer exists */}
                    {buyerOffer ? (
                      <div className="space-y-4">
                        <div className="bg-yellow-50 border-4 border-yellow-300 rounded-xl p-6">
                          <div className="flex items-center mb-3">
                            <AlertCircle className="h-8 w-8 text-yellow-600 mr-3" />
                            <h3 className="text-lg font-bold">You Already Made an Offer!</h3>
                          </div>
                          <p className="text-gray-700 mb-4">
                            Your offer of <strong>{formatPrice(buyerOffer.offerPrice)}</strong> is waiting for the seller's response.
                          </p>
                          <div className="bg-white rounded-lg p-4 border-2 border-yellow-200">
                            <p className="text-lg font-semibold mb-2">👉 What to do next:</p>
                            <Button 
                              className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
                              onClick={() => router.push(`/transactions/${buyerOffer.id}`)}
                            >
                              <MessageSquare className="mr-2 h-6 w-6" />
                              View Your Offer & Negotiate
                            </Button>
                          </div>
                          <div className="text-sm text-gray-600 mt-3">
                            Status: <Badge variant="secondary">{buyerOffer.status}</Badge>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {!property.hasUserInterest ? (
                          <Button
                            className="w-full"
                            onClick={handleExpressInterest}
                            disabled={isExpressingInterest}
                          >
                            {isExpressingInterest ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Expressing Interest...
                              </>
                            ) : (
                              <>
                                <Heart className="mr-2 h-4 w-4" />
                                Express Interest
                              </>
                            )}
                          </Button>
                        ) : (
                          <Alert className="border-green-200 bg-green-50">
                            <Heart className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                              You have expressed interest in this property
                            </AlertDescription>
                          </Alert>
                        )}

                        {userKyc2Status === 'PASSED' ? (
                          <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full">
                                <DollarSign className="mr-2 h-4 w-4" />
                                Make Offer
                              </Button>
                            </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Make an Offer</DialogTitle>
                          <p className="text-sm text-gray-600">
                            Submit your offer for {property.title}
                          </p>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="offer-price">Offer Price (EUR)</Label>
                            <Input
                              id="offer-price"
                              type="number"
                              min="1"
                              step="1000"
                              placeholder="Enter your offer price"
                              value={offerForm.price}
                              onChange={(e) => setOfferForm(prev => ({ ...prev, price: e.target.value }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Property asking price: {formatPrice(property.price)}
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor="offer-message">Message (Optional)</Label>
                            <Textarea
                              id="offer-message"
                              placeholder="Add a personal message to the seller..."
                              value={offerForm.message}
                              onChange={(e) => setOfferForm(prev => ({ ...prev, message: e.target.value }))}
                              rows={3}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="offer-terms">Special Terms (Optional)</Label>
                            <Textarea
                              id="offer-terms"
                              placeholder="Any special conditions or terms..."
                              value={offerForm.terms}
                              onChange={(e) => setOfferForm(prev => ({ ...prev, terms: e.target.value }))}
                              rows={2}
                            />
                          </div>

                          <div className="space-y-4">
                            <Label>Payment Method</Label>
                            <Select
                              value={offerForm.paymentMethod}
                              onValueChange={(value: 'FIAT' | 'CRYPTO' | 'HYBRID') => {
                                setOfferForm(prev => ({ 
                                  ...prev, 
                                  paymentMethod: value,
                                  // Reset percentages when changing from hybrid
                                  cryptoPercentage: 50,
                                  fiatPercentage: 50
                                }))
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FIAT">
                                  <div className="flex items-center">
                                    <Euro className="mr-2 h-4 w-4" />
                                    <span>Traditional Bank Transfer (EUR)</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="CRYPTO">
                                  <div className="flex items-center">
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    <span>Cryptocurrency (BTC, ETH, USDT)</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="HYBRID">
                                  <div className="flex items-center">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    <span>Hybrid (Mix of Fiat & Crypto)</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Show percentage sliders for hybrid payment */}
                            {offerForm.paymentMethod === 'HYBRID' && (
                              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium">Payment Split</p>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Fiat (EUR)</span>
                                    <span className="font-medium">{offerForm.fiatPercentage}%</span>
                                  </div>
                                  <Slider
                                    value={[offerForm.fiatPercentage]}
                                    onValueChange={(value) => {
                                      const fiatPercent = value[0]
                                      const cryptoPercent = 100 - fiatPercent
                                      setOfferForm(prev => ({
                                        ...prev,
                                        fiatPercentage: fiatPercent,
                                        cryptoPercentage: cryptoPercent
                                      }))
                                    }}
                                    max={100}
                                    min={0}
                                    step={5}
                                    className="w-full"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Crypto</span>
                                    <span className="font-medium">{offerForm.cryptoPercentage}%</span>
                                  </div>
                                  <Slider
                                    value={[offerForm.cryptoPercentage]}
                                    onValueChange={(value) => {
                                      const cryptoPercent = value[0]
                                      const fiatPercent = 100 - cryptoPercent
                                      setOfferForm(prev => ({
                                        ...prev,
                                        cryptoPercentage: cryptoPercent,
                                        fiatPercentage: fiatPercent
                                      }))
                                    }}
                                    max={100}
                                    min={0}
                                    step={5}
                                    className="w-full"
                                  />
                                </div>

                                <div className="pt-2 text-xs text-gray-600">
                                  <p>• Fiat: €{((parseFloat(offerForm.price) || 0) * offerForm.fiatPercentage / 100).toLocaleString()}</p>
                                  <p>• Crypto: €{((parseFloat(offerForm.price) || 0) * offerForm.cryptoPercentage / 100).toLocaleString()}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {error && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          )}
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsOfferDialogOpen(false)
                              setError('')
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleMakeOffer}
                            disabled={isMakingOffer || !offerForm.price}
                          >
                            {isMakingOffer ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Offer'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                        ) : (
                          <div className="space-y-3">
                            <Alert className="border-orange-200 bg-orange-50">
                              <Shield className="h-4 w-4 text-orange-600" />
                              <AlertDescription>
                                <strong className="text-orange-900">KYC Tier 2 Required</strong>
                                <p className="text-sm text-orange-700 mt-1">
                                  Complete KYC Tier 2 verification to make offers on properties.
                                </p>
                              </AlertDescription>
                            </Alert>
                            <Button
                              className="w-full bg-orange-600 hover:bg-orange-700"
                              onClick={() => router.push('/kyc2')}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Complete KYC Tier 2 to Make Offers
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {session.user.role === 'SELLER' && property.sellerId === session.user.id && (
                  <div className="space-y-3">
                    <Alert>
                      <HomeIcon className="h-4 w-4" />
                      <AlertDescription>
                        This is your property listing
                      </AlertDescription>
                    </Alert>
                    
                    {/* Active Offers Section */}
                    {isLoadingTransactions ? (
                      <Card>
                        <CardContent className="flex items-center justify-center py-4">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span className="text-sm">Loading offers...</span>
                        </CardContent>
                      </Card>
                    ) : propertyTransactions.length > 0 ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Active Offers ({propertyTransactions.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {propertyTransactions.map(transaction => (
                              <div key={transaction.id} className="border rounded-lg p-3 hover:bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    {getStatusBadge(transaction.status)}
                                    {transaction.needsSellerResponse && (
                                      <Badge className="bg-red-100 text-red-800 text-xs">
                                        Needs Response
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm font-semibold">
                                    {formatPrice(transaction.latestCounterOffer?.price || transaction.offerPrice)}
                                  </div>
                                </div>
                                
                                <div className="text-xs text-gray-600 mb-1">
                                  From: {transaction.buyer.firstName} {transaction.buyer.lastName}
                                </div>
                                
                                {transaction.offerMessage && (
                                  <div className="text-xs text-gray-700 mb-2 bg-gray-50 p-2 rounded">
                                    "{transaction.offerMessage}"
                                  </div>
                                )}
                                
                                <div className="flex justify-between items-center">
                                  <div className="text-xs text-gray-500">
                                    {formatDate(transaction.createdAt)}
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => router.push(`/transactions/${transaction.id}`)}
                                  >
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {propertyTransactions.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => router.push('/transactions?role=selling')}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                View All My Transactions
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Alert>
                        <MessageSquare className="h-4 w-4" />
                        <AlertDescription>
                          No offers received yet. Share your property code with potential buyers.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {session.user.role === 'ADMIN' && (
                  <Button variant="outline" className="w-full" disabled>
                    <Shield className="mr-2 h-4 w-4" />
                    Manage Property (Admin)
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Property Documents - Only for buyers */}
            {session?.user && session.user.role === 'BUYER' && (
              <PropertyDocuments 
                propertyId={property.id}
                propertyCode={property.code}
                sellerId={property.sellerId}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Code:</span>
                  <span className="font-mono">{property.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{property.complianceStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Listed:</span>
                  <span>{formatDate(property.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span>{formatDate(property.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}