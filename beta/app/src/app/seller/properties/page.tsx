'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Home, Plus, Eye, Users, FileText, Loader2, MapPin, Euro, Calendar } from 'lucide-react'

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
  createdAt: string
  updatedAt: string
  interestCount: number
  transactionCount: number
}

export default function PropertiesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'SELLER') {
      router.push('/auth/signin')
    } else {
      fetchProperties()
    }
  }, [session, status, router])

  const fetchProperties = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/properties')
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties')
      }

      const data = await response.json()
      setProperties(data.properties || [])
    } catch (error) {
      console.error('Error fetching properties:', error)
      setError('Failed to load properties')
    } finally {
      setIsLoading(false)
    }
  }

  const getComplianceStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending Review</Badge>
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

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session || session.user.role !== 'SELLER') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/seller/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
              <p className="text-gray-600 mt-2">Manage your property listings</p>
            </div>
            <Button
              onClick={() => router.push('/seller/properties/new')}
              className="mt-4 sm:mt-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              List New Property
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading properties...</span>
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Listed</h3>
              <p className="text-gray-500 mb-6">
                You haven't listed any properties yet. Start by adding your first property to the marketplace.
              </p>
              <Button onClick={() => router.push('/seller/properties/new')}>
                <Plus className="mr-2 h-4 w-4" />
                List Your First Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{property.title}</CardTitle>
                      <CardDescription className="text-sm font-mono text-blue-600">
                        {property.code}
                      </CardDescription>
                    </div>
                    {getComplianceStatusBadge(property.complianceStatus)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {property.city}, {property.country}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <Euro className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{formatPrice(property.price)}</span>
                    </div>

                    {(property.bedrooms || property.bathrooms || property.area) && (
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        {property.bedrooms && (
                          <span>{property.bedrooms} beds</span>
                        )}
                        {property.bathrooms && (
                          <span>{property.bathrooms} baths</span>
                        )}
                        {property.area && (
                          <span>{property.area}m²</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Listed {formatDate(property.createdAt)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{property.interestCount}</span>
                      </div>
                      <p className="text-xs text-gray-500">Interested</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-sm text-gray-600">
                        <FileText className="h-4 w-4 mr-1" />
                        <span>{property.transactionCount}</span>
                      </div>
                      <p className="text-xs text-gray-500">Offers</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        router.push(`/seller/properties/${property.id}`)
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View & Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        router.push(`/seller/properties/${property.id}/documents`)
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Documents
                    </Button>
                  </div>

                  {property.complianceStatus === 'REJECTED' && property.complianceNotes && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertDescription className="text-xs">
                        <strong>Compliance Notes:</strong> {property.complianceNotes}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}