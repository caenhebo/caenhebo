'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, Info, AlertCircle } from 'lucide-react'
import { countries } from '@/lib/countries'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface KycFormProps {
  onSubmit: (data: KycFormData) => Promise<void>
  initialData?: Partial<KycFormData>
}

export interface KycFormData {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  phoneCountryCode?: string
  phoneLocalNumber?: string
  dateOfBirth: string
  address: {
    addressLine1: string
    addressLine2?: string
    city: string
    postalCode: string
    country: string
  }
}

export function KycForm({ onSubmit, initialData }: KycFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  
  // Parse initial phone number if provided
  const parseInitialPhone = (phone: string | undefined) => {
    if (!phone) return { countryCode: '+351', localNumber: '' }
    
    const europeanCodes = ['+351', '+34', '+33', '+49', '+39', '+31', '+32', '+43', '+45', '+46', '+47', '+48', '+30', '+353', '+352', '+354', '+356', '+357', '+358', '+359', '+370', '+371', '+372', '+385', '+386', '+420', '+421', '+423', '+36', '+40']
    
    for (const code of europeanCodes) {
      if (phone.startsWith(code)) {
        return {
          countryCode: code,
          localNumber: phone.substring(code.length).trim()
        }
      }
    }
    
    return { countryCode: '+351', localNumber: phone }
  }
  
  const initialPhone = parseInitialPhone(initialData?.phoneNumber)
  
  const [formData, setFormData] = useState<KycFormData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phoneNumber: initialData?.phoneNumber || '',
    phoneCountryCode: initialPhone.countryCode,
    phoneLocalNumber: initialPhone.localNumber,
    dateOfBirth: initialData?.dateOfBirth || '',
    address: {
      addressLine1: initialData?.address?.addressLine1 || '',
      addressLine2: initialData?.address?.addressLine2 || '',
      city: initialData?.address?.city || '',
      postalCode: initialData?.address?.postalCode || '',
      country: initialData?.address?.country || 'PT' // Default to Portugal
    }
  })

  // Helper to update phone number when country code or local number changes
  const updatePhoneNumber = (countryCode: string, localNumber: string) => {
    const cleanLocal = localNumber.replace(/\D/g, '')
    return countryCode + cleanLocal
  }

  // Validate a single field
  const validateField = (fieldName: string, value: any): string => {
    const errors: Record<string, string> = {}
    
    // Create a temporary form data with the new value
    const tempFormData = { ...formData }
    if (fieldName.includes('.')) {
      const [parent, child] = fieldName.split('.')
      if (parent === 'address') {
        tempFormData.address = { ...tempFormData.address, [child]: value }
      }
    } else {
      (tempFormData as any)[fieldName] = value
    }
    
    // Run validation on the temporary data
    const fullErrors = validateFormData(tempFormData)
    return fullErrors[fieldName.replace('.', '')] || ''
  }

  // Extract validation logic to be reusable
  const validateFormData = (data: KycFormData): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    // Copy the entire validation logic from validateForm but use 'data' parameter
    // Validate first name
    if (!data.firstName.trim()) {
      errors.firstName = 'First name is required'
    } else if (data.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters'
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(data.firstName)) {
      errors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes'
    }
    
    // Validate last name
    if (!data.lastName.trim()) {
      errors.lastName = 'Last name is required'
    } else if (data.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters'
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(data.lastName)) {
      errors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!data.email.trim()) {
      errors.email = 'Email is required'
    } else if (!emailRegex.test(data.email)) {
      errors.email = 'Please enter a valid email address (e.g., user@example.com)'
    } else if (data.email.length > 100) {
      errors.email = 'Email address is too long'
    }
    
    // Validate phone number - must be European
    if (!data.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required'
    } else {
      const cleanPhone = data.phoneNumber.replace(/[\s()-]/g, '')
      const europeanCodes = {
        '+351': 'Portugal', '+34': 'Spain', '+33': 'France', '+49': 'Germany', 
        '+39': 'Italy', '+31': 'Netherlands', '+32': 'Belgium', '+43': 'Austria',
        '+45': 'Denmark', '+46': 'Sweden', '+47': 'Norway', '+48': 'Poland',
        '+30': 'Greece', '+353': 'Ireland', '+352': 'Luxembourg', '+354': 'Iceland',
        '+356': 'Malta', '+357': 'Cyprus', '+358': 'Finland', '+359': 'Bulgaria',
        '+370': 'Lithuania', '+371': 'Latvia', '+372': 'Estonia', '+385': 'Croatia',
        '+386': 'Slovenia', '+420': 'Czech Republic', '+421': 'Slovakia', 
        '+423': 'Liechtenstein', '+36': 'Hungary', '+40': 'Romania'
      }
      
      let foundCountry = ''
      let countryCode = ''
      for (const [code, country] of Object.entries(europeanCodes)) {
        if (cleanPhone.startsWith(code)) {
          foundCountry = country
          countryCode = code
          break
        }
      }
      
      if (!foundCountry) {
        if (cleanPhone.startsWith('+1')) {
          errors.phoneNumber = 'US/Canada numbers are not supported. Please use a European phone number'
        } else if (cleanPhone.startsWith('+44')) {
          errors.phoneNumber = 'UK numbers are not supported. Please use an EU/EEA phone number'
        } else if (!cleanPhone.startsWith('+')) {
          errors.phoneNumber = 'Phone number must include country code (e.g., +351 for Portugal)'
        } else {
          errors.phoneNumber = 'Only European phone numbers are supported. Please use an EU/EEA number'
        }
      } else {
        // Extract the number part after country code
        const number = cleanPhone.substring(countryCode.length)
        
        if (number.length === 0) {
          errors.phoneNumber = `Please enter the phone number after the country code`
        } else if (!/^\d+$/.test(number)) {
          errors.phoneNumber = 'Phone number can only contain digits after the country code'
        } else if (number.length < 6) {
          errors.phoneNumber = `Phone number too short. ${foundCountry} numbers should be at least 6 digits`
        } else if (number.length > 15) {
          errors.phoneNumber = `Phone number too long. Maximum 15 digits allowed`
        }
      }
    }
    
    // Validate date of birth
    if (!data.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required'
    } else {
      const dob = new Date(data.dateOfBirth)
      const today = new Date()
      
      if (isNaN(dob.getTime())) {
        errors.dateOfBirth = 'Please enter a valid date'
      } else if (dob > today) {
        errors.dateOfBirth = 'Date of birth cannot be in the future'
      } else {
        const age = today.getFullYear() - dob.getFullYear()
        const monthDiff = today.getMonth() - dob.getMonth()
        const dayDiff = today.getDate() - dob.getDate()
        const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age
        
        if (actualAge < 18) {
          errors.dateOfBirth = 'You must be at least 18 years old to use this service'
        } else if (actualAge > 120) {
          errors.dateOfBirth = 'Please enter a valid date of birth'
        }
      }
    }
    
    // Validate address
    if (!data.address.addressLine1.trim()) {
      errors.addressLine1 = 'Street address is required'
    } else if (data.address.addressLine1.trim().length < 5) {
      errors.addressLine1 = 'Please enter a complete street address'
    } else if (data.address.addressLine1.length > 100) {
      errors.addressLine1 = 'Address is too long (max 100 characters)'
    }
    
    if (!data.address.city.trim()) {
      errors.city = 'City is required'
    } else if (data.address.city.trim().length < 2) {
      errors.city = 'Please enter a valid city name'
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(data.address.city)) {
      errors.city = 'City name can only contain letters, spaces, and hyphens'
    }
    
    // Validate postal code based on country
    if (!data.address.postalCode.trim()) {
      errors.postalCode = 'Postal code is required'
    } else {
      const postalCodePatterns: Record<string, { pattern: RegExp, format: string }> = {
        'PT': { pattern: /^\d{4}-?\d{3}$/, format: '1234-567 or 1234567' },
        'ES': { pattern: /^\d{5}$/, format: '12345' },
        'FR': { pattern: /^\d{5}$/, format: '12345' },
        'DE': { pattern: /^\d{5}$/, format: '12345' },
        'IT': { pattern: /^\d{5}$/, format: '12345' },
        'NL': { pattern: /^\d{4}\s?[A-Z]{2}$/i, format: '1234 AB' },
        'BE': { pattern: /^\d{4}$/, format: '1234' },
        'AT': { pattern: /^\d{4}$/, format: '1234' },
        'DK': { pattern: /^\d{4}$/, format: '1234' },
        'SE': { pattern: /^\d{3}\s?\d{2}$/, format: '123 45' },
        'NO': { pattern: /^\d{4}$/, format: '1234' },
        'FI': { pattern: /^\d{5}$/, format: '12345' },
        'PL': { pattern: /^\d{2}-\d{3}$/, format: '12-345' },
        'GR': { pattern: /^\d{3}\s?\d{2}$/, format: '123 45' },
        'IE': { pattern: /^[A-Z]\d{2}\s?[A-Z0-9]{4}$|^[A-Z]{3}\s?[A-Z0-9]{4}$/i, format: 'A12 B3C4 or ABC 1234' }
      }
      
      const countryPattern = postalCodePatterns[data.address.country]
      if (countryPattern) {
        const cleanPostalCode = data.address.postalCode.trim()
        if (!countryPattern.pattern.test(cleanPostalCode)) {
          errors.postalCode = `Invalid format. Expected format: ${countryPattern.format}`
        }
      }
    }
    
    return errors
  }

  // Update the original validateForm to use the new function
  const validateForm = (): boolean => {
    const errors = validateFormData(formData)
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      dateOfBirth: true,
      addressLine1: true,
      city: true,
      postalCode: true,
      country: true
    }
    setTouchedFields(allTouched)
    
    // Validate form before submission
    if (!validateForm()) {
      setError('Please fix the errors below before submitting')
      return
    }
    
    setLoading(true)

    try {
      await onSubmit(formData)
    } catch (err) {
      // Extract more specific error message
      let errorMessage = 'Failed to submit KYC data'
      const fieldErrors: Record<string, string> = {}
      
      if (err instanceof Error) {
        errorMessage = err.message
        
        // Map specific server errors to field errors
        if (err.message.includes('phone number')) {
          fieldErrors.phoneNumber = err.message
        } else if (err.message.includes('email')) {
          fieldErrors.email = err.message
        } else if (err.message.includes('postal') || err.message.includes('postalCode')) {
          fieldErrors.postalCode = 'Invalid postal code for selected country'
        } else if (err.message.includes('date of birth') || err.message.includes('dateOfBirth')) {
          fieldErrors.dateOfBirth = err.message
        } else if (err.message.includes('firstName')) {
          fieldErrors.firstName = err.message
        } else if (err.message.includes('lastName')) {
          fieldErrors.lastName = err.message
        } else if (err.message.includes('address')) {
          fieldErrors.addressLine1 = err.message
        } else if (err.message.includes('city')) {
          fieldErrors.city = err.message
        }
      }
      
      // If we mapped any field errors, show them
      if (Object.keys(fieldErrors).length > 0) {
        setValidationErrors({ ...validationErrors, ...fieldErrors })
        // Mark those fields as touched
        const touchedFromErrors = Object.keys(fieldErrors).reduce((acc, key) => {
          acc[key] = true
          return acc
        }, {} as Record<string, boolean>)
        setTouchedFields({ ...touchedFields, ...touchedFromErrors })
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle>Identity Verification</CardTitle>
        </div>
        <CardDescription>
          Fill your data to start your Know Your Customer verification process.
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-amber-600 font-semibold cursor-help inline-flex items-center gap-1">
                  Only European residents are supported
                  <Info className="h-3 w-3" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="font-semibold mb-2">Supported Countries:</p>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <div>Austria, Belgium, Bulgaria, Croatia, Cyprus, Czech Republic, Denmark, Estonia, Finland, France</div>
                  <div>Germany, Greece, Hungary, Iceland, Ireland, Italy, Latvia, Liechtenstein, Lithuania, Luxembourg</div>
                  <div>Malta, Netherlands, Norway, Poland, Portugal</div>
                  <div>Romania, Slovakia, Slovenia, Spain, Sweden</div>
                </div>
                <p className="mt-2 text-amber-600">UK, US, and non-EU countries are NOT supported.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value })
                  if (validationErrors.firstName) {
                    setValidationErrors({ ...validationErrors, firstName: '' })
                  }
                }}
                onBlur={() => {
                  setTouchedFields({ ...touchedFields, firstName: true })
                  const error = validateField('firstName', formData.firstName)
                  if (error) {
                    setValidationErrors({ ...validationErrors, firstName: error })
                  }
                }}
                disabled={loading}
                className={validationErrors.firstName && touchedFields.firstName ? 'border-red-500' : ''}
              />
              {validationErrors.firstName && touchedFields.firstName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) => {
                  setFormData({ ...formData, lastName: e.target.value })
                  if (validationErrors.lastName) {
                    setValidationErrors({ ...validationErrors, lastName: '' })
                  }
                }}
                onBlur={() => {
                  setTouchedFields({ ...touchedFields, lastName: true })
                  const error = validateField('lastName', formData.lastName)
                  if (error) {
                    setValidationErrors({ ...validationErrors, lastName: error })
                  }
                }}
                disabled={loading}
                className={validationErrors.lastName && touchedFields.lastName ? 'border-red-500' : ''}
              />
              {validationErrors.lastName && touchedFields.lastName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                if (validationErrors.email) {
                  setValidationErrors({ ...validationErrors, email: '' })
                }
              }}
              onBlur={() => {
                setTouchedFields({ ...touchedFields, email: true })
                const error = validateField('email', formData.email)
                if (error) {
                  setValidationErrors({ ...validationErrors, email: error })
                }
              }}
              disabled={loading}
              className={validationErrors.email && touchedFields.email ? 'border-red-500' : ''}
            />
            {validationErrors.email && touchedFields.email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <Label>Phone Number</Label>
            <div className="flex gap-4">
              <div className="w-36">
                <Label htmlFor="phoneCountryCode" className="text-xs text-gray-500">Country Code</Label>
                <Select
                  value={formData.phoneCountryCode}
                  onValueChange={(value) => {
                    const newPhone = updatePhoneNumber(value, formData.phoneLocalNumber || '')
                    setFormData({ 
                      ...formData, 
                      phoneCountryCode: value,
                      phoneNumber: newPhone
                    })
                    // Clear error on change
                    if (validationErrors.phoneNumber) {
                      setValidationErrors({ ...validationErrors, phoneNumber: '' })
                    }
                    // Mark as touched and validate
                    setTouchedFields({ ...touchedFields, phoneNumber: true })
                    const error = validateField('phoneNumber', newPhone)
                    if (error) {
                      setValidationErrors({ ...validationErrors, phoneNumber: error })
                    }
                  }}
                  disabled={loading}
                >
                  <SelectTrigger 
                    id="phoneCountryCode"
                    className={validationErrors.phoneNumber && touchedFields.phoneNumber ? 'border-red-500' : ''}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+351">🇵🇹 +351 (Portugal)</SelectItem>
                    <SelectItem value="+34">🇪🇸 +34 (Spain)</SelectItem>
                    <SelectItem value="+33">🇫🇷 +33 (France)</SelectItem>
                    <SelectItem value="+49">🇩🇪 +49 (Germany)</SelectItem>
                    <SelectItem value="+39">🇮🇹 +39 (Italy)</SelectItem>
                    <SelectItem value="+31">🇳🇱 +31 (Netherlands)</SelectItem>
                    <SelectItem value="+32">🇧🇪 +32 (Belgium)</SelectItem>
                    <SelectItem value="+43">🇦🇹 +43 (Austria)</SelectItem>
                    <SelectItem value="+45">🇩🇰 +45 (Denmark)</SelectItem>
                    <SelectItem value="+46">🇸🇪 +46 (Sweden)</SelectItem>
                    <SelectItem value="+47">🇳🇴 +47 (Norway)</SelectItem>
                    <SelectItem value="+48">🇵🇱 +48 (Poland)</SelectItem>
                    <SelectItem value="+30">🇬🇷 +30 (Greece)</SelectItem>
                    <SelectItem value="+353">🇮🇪 +353 (Ireland)</SelectItem>
                    <SelectItem value="+352">🇱🇺 +352 (Luxembourg)</SelectItem>
                    <SelectItem value="+354">🇮🇸 +354 (Iceland)</SelectItem>
                    <SelectItem value="+356">🇲🇹 +356 (Malta)</SelectItem>
                    <SelectItem value="+357">🇨🇾 +357 (Cyprus)</SelectItem>
                    <SelectItem value="+358">🇫🇮 +358 (Finland)</SelectItem>
                    <SelectItem value="+359">🇧🇬 +359 (Bulgaria)</SelectItem>
                    <SelectItem value="+370">🇱🇹 +370 (Lithuania)</SelectItem>
                    <SelectItem value="+371">🇱🇻 +371 (Latvia)</SelectItem>
                    <SelectItem value="+372">🇪🇪 +372 (Estonia)</SelectItem>
                    <SelectItem value="+385">🇭🇷 +385 (Croatia)</SelectItem>
                    <SelectItem value="+386">🇸🇮 +386 (Slovenia)</SelectItem>
                    <SelectItem value="+420">🇨🇿 +420 (Czech Republic)</SelectItem>
                    <SelectItem value="+421">🇸🇰 +421 (Slovakia)</SelectItem>
                    <SelectItem value="+423">🇱🇮 +423 (Liechtenstein)</SelectItem>
                    <SelectItem value="+36">🇭🇺 +36 (Hungary)</SelectItem>
                    <SelectItem value="+40">🇷🇴 +40 (Romania)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="phoneLocalNumber" className="text-xs text-gray-500">Phone Number</Label>
                <Input
                  id="phoneLocalNumber"
                  type="tel"
                  required
                  placeholder="900000000"
                  value={formData.phoneLocalNumber}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '')
                    const newPhone = updatePhoneNumber(formData.phoneCountryCode || '+351', value)
                    setFormData({ 
                      ...formData, 
                      phoneLocalNumber: value,
                      phoneNumber: newPhone
                    })
                    if (validationErrors.phoneNumber) {
                      setValidationErrors({ ...validationErrors, phoneNumber: '' })
                    }
                  }}
                  onBlur={() => {
                    setTouchedFields({ ...touchedFields, phoneNumber: true })
                    const error = validateField('phoneNumber', formData.phoneNumber)
                    if (error) {
                      setValidationErrors({ ...validationErrors, phoneNumber: error })
                    }
                  }}
                  disabled={loading}
                  className={validationErrors.phoneNumber && touchedFields.phoneNumber ? 'border-red-500' : ''}
                />
              </div>
            </div>
            {validationErrors.phoneNumber && touchedFields.phoneNumber && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.phoneNumber}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Only European phone numbers are supported</p>
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              required
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              value={formData.dateOfBirth}
              onChange={(e) => {
                setFormData({ ...formData, dateOfBirth: e.target.value })
                if (validationErrors.dateOfBirth) {
                  setValidationErrors({ ...validationErrors, dateOfBirth: '' })
                }
              }}
              onBlur={() => {
                setTouchedFields({ ...touchedFields, dateOfBirth: true })
                const error = validateField('dateOfBirth', formData.dateOfBirth)
                if (error) {
                  setValidationErrors({ ...validationErrors, dateOfBirth: error })
                }
              }}
              disabled={loading}
              className={validationErrors.dateOfBirth && touchedFields.dateOfBirth ? 'border-red-500' : ''}
            />
            {validationErrors.dateOfBirth && touchedFields.dateOfBirth && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.dateOfBirth}</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Address</h3>
            
            <div>
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.address.country}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    address: { ...formData.address, country: value }
                  })
                  // Revalidate postal code when country changes
                  if (touchedFields.postalCode && formData.address.postalCode) {
                    const error = validateField('address.postalCode', formData.address.postalCode)
                    if (error) {
                      setValidationErrors({ ...validationErrors, postalCode: error })
                    } else {
                      setValidationErrors({ ...validationErrors, postalCode: '' })
                    }
                  }
                }}
                disabled={loading}
              >
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                required
                value={formData.address.city}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value }
                  })
                  if (validationErrors.city) {
                    setValidationErrors({ ...validationErrors, city: '' })
                  }
                }}
                onBlur={() => {
                  setTouchedFields({ ...touchedFields, city: true })
                  const error = validateField('address.city', formData.address.city)
                  if (error) {
                    setValidationErrors({ ...validationErrors, city: error })
                  }
                }}
                disabled={loading}
                className={validationErrors.city && touchedFields.city ? 'border-red-500' : ''}
              />
              {validationErrors.city && touchedFields.city && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                required
                placeholder="Street address"
                value={formData.address.addressLine1}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    address: { ...formData.address, addressLine1: e.target.value }
                  })
                  if (validationErrors.addressLine1) {
                    setValidationErrors({ ...validationErrors, addressLine1: '' })
                  }
                }}
                onBlur={() => {
                  setTouchedFields({ ...touchedFields, addressLine1: true })
                  const error = validateField('address.addressLine1', formData.address.addressLine1)
                  if (error) {
                    setValidationErrors({ ...validationErrors, addressLine1: error })
                  }
                }}
                disabled={loading}
                className={validationErrors.addressLine1 && touchedFields.addressLine1 ? 'border-red-500' : ''}
              />
              {validationErrors.addressLine1 && touchedFields.addressLine1 && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.addressLine1}</p>
              )}
            </div>

            <div>
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input
                id="addressLine2"
                placeholder="Apartment, suite, etc."
                value={formData.address.addressLine2}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, addressLine2: e.target.value }
                })}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  required
                  placeholder={
                    formData.address.country === 'PT' ? '1234-567' :
                    formData.address.country === 'NL' ? '1234 AB' :
                    formData.address.country === 'PL' ? '12-345' :
                    formData.address.country === 'SE' ? '123 45' :
                    formData.address.country === 'GR' ? '123 45' :
                    formData.address.country === 'IE' ? 'A12 B3C4' :
                    '12345'
                  }
                  value={formData.address.postalCode}
                  onChange={(e) => {
                    // Handle different country postal code formats
                    const country = formData.address.country
                    let value = e.target.value
                    
                    if (country === 'PT') {
                      // Portugal: Only allow numbers and auto-format
                      value = value.replace(/\D/g, '')
                      if (value.length <= 7) {
                        // Auto-add dash after 4 digits
                        const formatted = value.length > 4 
                          ? `${value.slice(0, 4)}-${value.slice(4)}`
                          : value
                        setFormData({
                          ...formData,
                          address: { ...formData.address, postalCode: formatted }
                        })
                      }
                    } else if (country === 'NL') {
                      // Netherlands: Format as 1234 AB
                      const numbers = value.replace(/[^0-9]/g, '')
                      const letters = value.replace(/[^A-Za-z]/g, '').toUpperCase()
                      if (numbers.length <= 4 && letters.length <= 2) {
                        const formatted = numbers + (letters ? ' ' + letters : '')
                        setFormData({
                          ...formData,
                          address: { ...formData.address, postalCode: formatted.trim() }
                        })
                      }
                    } else {
                      // Other countries: just set the value as-is
                      setFormData({
                        ...formData,
                        address: { ...formData.address, postalCode: value }
                      })
                    }
                    
                    if (validationErrors.postalCode) {
                      setValidationErrors({ ...validationErrors, postalCode: '' })
                    }
                  }}
                  onBlur={() => {
                    setTouchedFields({ ...touchedFields, postalCode: true })
                    const error = validateField('address.postalCode', formData.address.postalCode)
                    if (error) {
                      setValidationErrors({ ...validationErrors, postalCode: error })
                    }
                  }}
                  disabled={loading}
                  className={validationErrors.postalCode && touchedFields.postalCode ? 'border-red-500' : ''}
                />
              {validationErrors.postalCode && touchedFields.postalCode && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.postalCode}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}