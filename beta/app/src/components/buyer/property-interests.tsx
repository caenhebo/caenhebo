'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Home, Calendar, MapPin, Building, ExternalLink, RefreshCcw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PropertyInterest {
  id: string
  message: string | null
  interestedAt: string
  property: {
    id: string
    code: string
    title: string
    description: string
    location: string
    price: number
    area: number
    complianceStatus: string
    mainImage: string | null
    seller: {
      name: string
      email: string
    }
  }
}

export function PropertyInterests() {
  const [interests, setInterests] = useState<PropertyInterest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchInterests = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/buyer/interests')
      
      if (!response.ok) {
        throw new Error('Failed to fetch interests')
      }

      const data = await response.json()
      setInterests(data.interests)
    } catch (err) {
      console.error('Error fetching interests:', err)
      setError('Failed to load your property interests')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInterests()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Property Interests</CardTitle>
          <CardDescription>Properties you've expressed interest in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCcw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2">Loading your interests...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Property Interests</CardTitle>
          <CardDescription>Properties you've expressed interest in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchInterests} variant="outline" size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (interests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Property Interests</CardTitle>
          <CardDescription>Properties you've expressed interest in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              You haven't expressed interest in any properties yet.
            </p>
            <Button onClick={() => router.push('/properties')} variant="outline">
              Browse Properties
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>My Property Interests</CardTitle>
            <CardDescription>
              {interests.length} {interests.length === 1 ? 'property' : 'properties'} you've expressed interest in
            </CardDescription>
          </div>
          <Button onClick={fetchInterests} variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interests.map((interest) => (
            <div
              key={interest.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/property/${interest.property.code}`)}
            >
              <div className="flex gap-4">
                {/* Property Image */}
                {interest.property.mainImage && (
                  <div className="flex-shrink-0">
                    <img
                      src={interest.property.mainImage}
                      alt={interest.property.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                {/* Property Details */}
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {interest.property.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-1">
                        Code: {interest.property.code}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/property/${interest.property.code}`)
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {interest.property.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {interest.property.area} m²
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-lg text-green-600">
                        {formatPrice(interest.property.price)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Seller: {interest.property.seller.name || interest.property.seller.email}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Interested {formatDistanceToNow(new Date(interest.interestedAt), { addSuffix: true })}
                      </p>
                      {interest.message && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          "{interest.message}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}