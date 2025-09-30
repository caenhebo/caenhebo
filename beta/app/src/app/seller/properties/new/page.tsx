'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Home, Loader2, CheckCircle, AlertCircle, Upload, X, Image as ImageIcon, FileText } from 'lucide-react'

interface FormData {
  title: string
  description: string
  propertyType: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  price: string
  area: string
  bedrooms: string
  bathrooms: string
}

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment (Apartamento)' },
  { value: 'HOUSE', label: 'House (Casa)' },
  { value: 'OFFICE', label: 'Office (Escritório)' },
  { value: 'BUILDING', label: 'Building (Prédio)' },
  { value: 'LOT', label: 'Lot (Lote / Terreno)' }
]

export default function NewPropertyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [diagrams, setDiagrams] = useState<File[]>([])
  const [photoPreview, setPhotoPreview] = useState<string[]>([])
  const [diagramPreview, setDiagramPreview] = useState<string[]>([])
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    propertyType: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Portugal',
    price: '',
    area: '',
    bedrooms: '',
    bathrooms: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'SELLER') {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear errors when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    const totalPhotos = photos.length + newFiles.length

    if (totalPhotos > 20) {
      setError('Maximum 20 photos allowed')
      return
    }

    // Create preview URLs
    const newPreviews = newFiles.map(file => URL.createObjectURL(file))

    setPhotos(prev => [...prev, ...newFiles])
    setPhotoPreview(prev => [...prev, ...newPreviews])
    setError('')
  }

  const handleDiagramUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    const newPreviews = newFiles.map(file => URL.createObjectURL(file))

    setDiagrams(prev => [...prev, ...newFiles])
    setDiagramPreview(prev => [...prev, ...newPreviews])
    setError('')
  }

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreview[index])
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreview(prev => prev.filter((_, i) => i !== index))
  }

  const removeDiagram = (index: number) => {
    URL.revokeObjectURL(diagramPreview[index])
    setDiagrams(prev => prev.filter((_, i) => i !== index))
    setDiagramPreview(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Property title is required'
    if (!formData.address.trim()) return 'Address is required'
    if (!formData.city.trim()) return 'City is required'
    if (!formData.postalCode.trim()) return 'Postal code is required'
    if (!formData.price.trim()) return 'Price is required'
    
    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) return 'Price must be a valid positive number'
    
    if (formData.area && isNaN(parseFloat(formData.area))) return 'Area must be a valid number'
    if (formData.bedrooms && isNaN(parseInt(formData.bedrooms))) return 'Bedrooms must be a valid number'
    if (formData.bathrooms && isNaN(parseInt(formData.bathrooms))) return 'Bathrooms must be a valid number'
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // First, create FormData for file uploads
      const uploadData = new FormData()
      uploadData.append('title', formData.title.trim())
      uploadData.append('description', formData.description.trim() || '')
      uploadData.append('propertyType', formData.propertyType || '')
      uploadData.append('address', formData.address.trim())
      uploadData.append('city', formData.city.trim())
      uploadData.append('state', formData.state.trim() || '')
      uploadData.append('postalCode', formData.postalCode.trim())
      uploadData.append('country', formData.country)
      uploadData.append('price', formData.price)
      uploadData.append('area', formData.area || '')
      uploadData.append('bedrooms', formData.bedrooms || '')
      uploadData.append('bathrooms', formData.bathrooms || '')

      // Add photos
      photos.forEach((photo) => {
        uploadData.append('photos', photo)
      })

      // Add diagrams
      diagrams.forEach((diagram) => {
        uploadData.append('diagrams', diagram)
      })

      const response = await fetch('/api/properties/create', {
        method: 'POST',
        body: uploadData // Don't set Content-Type, browser will set it with boundary
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create property')
      }

      setSuccess(`Property successfully listed with code: ${data.property.code}`)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/seller/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Error creating property:', error)
      setError(error instanceof Error ? error.message : 'Failed to create property')
    } finally {
      setIsSubmitting(false)
    }
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">List New Property</h1>
          <p className="text-gray-600 mt-2">Add your property to the Caenhebo marketplace</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Home className="mr-2 h-5 w-5" />
              Property Details
            </CardTitle>
            <CardDescription>
              All fields marked with * are required. Your property will be reviewed for compliance before being listed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property Type Selection */}
                <div className="md:col-span-2">
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, propertyType: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select property type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Beautiful 3-bedroom apartment in Lisbon"
                    className="mt-1"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your property, its features, and what makes it special..."
                    className="mt-1"
                    rows={4}
                  />
                </div>

                {/* Photo Upload */}
                <div className="md:col-span-2">
                  <Label>Property Photos (up to 20)</Label>
                  <div className="mt-2">
                    <label htmlFor="photos" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Click to upload photos ({photos.length}/20)
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB each</p>
                      </div>
                    </label>
                    <input
                      id="photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Photo Previews */}
                  {photoPreview.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {photoPreview.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Diagram Upload */}
                <div className="md:col-span-2">
                  <Label>Floor Plans / Diagrams</Label>
                  <div className="mt-2">
                    <label htmlFor="diagrams" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Click to upload floor plans/diagrams ({diagrams.length})
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 10MB each</p>
                      </div>
                    </label>
                    <input
                      id="diagrams"
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleDiagramUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Diagram Previews */}
                  {diagramPreview.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {diagramPreview.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDiagram(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Full street address"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Lisboa"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="state">District/Region</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="e.g., Lisboa"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="e.g., 1000-001"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="mt-1"
                    readOnly
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price (EUR) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g., 350000"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="area">Area (m²)</Label>
                  <Input
                    id="area"
                    name="area"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="e.g., 120.5"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    placeholder="e.g., 3"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    min="0"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <h4 className="font-medium mb-1">Compliance Review Process</h4>
                    <p>
                      After submission, your property will undergo a compliance review. This includes document verification 
                      and property validation. You'll be notified once the review is complete and your property is approved 
                      for listing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="sm:w-auto w-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="sm:w-auto w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Property...
                    </>
                  ) : (
                    <>
                      <Home className="mr-2 h-4 w-4" />
                      List Property
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}