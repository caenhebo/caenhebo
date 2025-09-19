'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Euro, Home, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'

interface PropertyOffer {
  id: string
  propertyId: string
  property: {
    id: string
    code: string
    title: string
    address: string
    city: string
    price: string
  }
  status: string
  offerPrice: string
  agreedPrice?: string
  createdAt: string
}

export default function PropertyOffers() {
  const router = useRouter()
  const [offers, setOffers] = useState<PropertyOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOffers()
  }, [])

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/buyer/offers')
      if (response.ok) {
        const data = await response.json()
        setOffers(data.offers || [])
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; icon: React.ReactNode } } = {
      'OFFER': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3 h-3" /> },
      'NEGOTIATION': { color: 'bg-orange-100 text-orange-800', icon: <MessageSquare className="w-3 h-3" /> },
      'AGREEMENT': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      'ESCROW': { color: 'bg-purple-100 text-purple-800', icon: <Euro className="w-3 h-3" /> },
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

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(parseFloat(price))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Property Offers</CardTitle>
          <CardDescription>Properties you've made offers on</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Loading offers...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Property Offers</CardTitle>
        <CardDescription>
          {offers.length > 0 
            ? `You have ${offers.length} active offer${offers.length > 1 ? 's' : ''}`
            : "Properties you've made offers on"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {offers.length === 0 ? (
          <div className="text-center py-8">
            <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">
              You haven't made any offers yet.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/buyer/properties')}
            >
              Browse Properties
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div 
                key={offer.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/transactions/${offer.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{offer.property.title}</h4>
                      {getStatusBadge(offer.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {offer.property.address}, {offer.property.city}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Code: {offer.property.code}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-600">Your offer: </span>
                      <span className="font-semibold text-blue-600">
                        {formatPrice(offer.offerPrice)}
                      </span>
                    </div>
                    {offer.agreedPrice && (
                      <div className="text-sm">
                        <span className="text-gray-600">Agreed price: </span>
                        <span className="font-semibold text-green-600">
                          {formatPrice(offer.agreedPrice)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/transactions/${offer.id}`)
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}