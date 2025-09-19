'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search,
  MapPin,
  Home,
  Euro,
  Bed,
  Bath,
  Square,
  Heart,
  Eye,
  AlertCircle,
  Filter,
  ArrowRight,
  Building
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
  seller: {
    firstName: string
    lastName: string
  }
  _count?: {
    interests: number
  }
  hasUserInterest?: boolean
}

export default function PropertiesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minBedrooms, setMinBedrooms] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Redirect based on user role
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'BUYER') {
        router.push('/buyer/properties')
        return
      } else if (session.user.role === 'SELLER') {
        router.push('/seller/properties')
        return
      } else if (session.user.role === 'ADMIN') {
        router.push('/admin')
        return
      }
    }
    
    // Load properties for non-authenticated users
    fetchProperties()
  }, [session, status, router])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (cityFilter) params.append('city', cityFilter)
      if (maxPrice) params.append('maxPrice', maxPrice)
      if (minBedrooms) params.append('minBedrooms', minBedrooms)

      const response = await fetch(`/api/properties/search?${params}`)
      if (!response.ok) throw new Error('Failed to fetch properties')

      const data = await response.json()
      setProperties(data.properties || [])
    } catch (err) {
      console.error('Error fetching properties:', err)
      setError('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProperties()
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(price))
  }

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  // Don't show the page if user is being redirected
  if (status === 'authenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg text-white p-8 mb-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">Find Your Dream Property in Portugal</h1>
            <p className="text-xl mb-6 opacity-95">
              Discover premium real estate opportunities with secure cryptocurrency and traditional payment options.
            </p>
            <div className="flex gap-4">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Notice for non-authenticated users */}
        {status === 'unauthenticated' && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Sign in to unlock full features:</strong> Save favorites, express interest, make offers, and access exclusive property details.
            </AlertDescription>
          </Alert>
        )}

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Search Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Property title or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="city">City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="city"
                      placeholder="Lisbon, Porto..."
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="maxPrice">Max Price (€)</Label>
                  <div className="relative">
                    <Euro className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="maxPrice"
                      type="number"
                      placeholder="500000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="minBedrooms">Min Bedrooms</Label>
                  <div className="relative">
                    <Bed className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="minBedrooms"
                      type="number"
                      placeholder="2"
                      value={minBedrooms}
                      onChange={(e) => setMinBedrooms(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" className="w-full md:w-auto">
                  <Search className="mr-2 h-4 w-4" />
                  Search Properties
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Found</h3>
              <p className="text-gray-600 text-center max-w-md">
                Try adjusting your search filters or check back later for new listings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{property.title}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {property.city}, {property.country}
                      </CardDescription>
                    </div>
                    <Badge variant={property.complianceStatus === 'APPROVED' ? 'default' : 'secondary'}>
                      {property.code}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Price */}
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice(property.price)}
                    </div>

                    {/* Property Details */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {property.bedrooms && (
                        <div className="flex items-center text-gray-600">
                          <Bed className="h-4 w-4 mr-1" />
                          {property.bedrooms} bed
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center text-gray-600">
                          <Bath className="h-4 w-4 mr-1" />
                          {property.bathrooms} bath
                        </div>
                      )}
                      {property.area && (
                        <div className="flex items-center text-gray-600">
                          <Square className="h-4 w-4 mr-1" />
                          {property.area}m²
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {property.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {property.description}
                      </p>
                    )}

                    {/* Interest Count */}
                    {property._count?.interests && property._count.interests > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Heart className="h-4 w-4 mr-1" />
                        {property._count.interests} interested buyer{property._count.interests !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  {status === 'unauthenticated' ? (
                    <Link href="/auth/signin" className="w-full">
                      <Button variant="outline" className="w-full">
                        Sign In to View Details
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/property/${property.code}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        {status === 'unauthenticated' && properties.length > 0 && (
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="text-center py-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Find Your Perfect Property?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Join Caenhebo to access exclusive features, save your favorite properties, 
                and start your journey to property ownership in Portugal.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg">
                    Create Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}