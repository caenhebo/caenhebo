'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ChevronDown, Search, X } from 'lucide-react'
import { countryCodes, popularCountryCodes, searchCountries, type CountryCode } from '@/lib/country-codes'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  required?: boolean
  className?: string
  error?: string
  placeholder?: string
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  className,
  error,
  placeholder = '900000000'
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    popularCountryCodes[0] // Default to Portugal
  )
  const [phoneNumber, setPhoneNumber] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Parse initial value to extract country code and phone number
  useEffect(() => {
    if (value) {
      // Find matching country code
      const matchingCountry = countryCodes.find(country =>
        value.startsWith(country.phoneCode)
      )

      if (matchingCountry) {
        setSelectedCountry(matchingCountry)
        setPhoneNumber(value.substring(matchingCountry.phoneCode.length))
      } else {
        // Default to current selection if no match
        setPhoneNumber(value)
      }
    }
  }, [])

  // Update parent value when country or number changes
  useEffect(() => {
    const fullNumber = selectedCountry.phoneCode + phoneNumber
    if (fullNumber !== value) {
      onChange(fullNumber)
    }
  }, [selectedCountry, phoneNumber])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, '')
    setPhoneNumber(value)
  }

  const filteredCountries = searchQuery
    ? searchCountries(searchQuery)
    : [...popularCountryCodes, ...countryCodes.filter(c =>
        !popularCountryCodes.find(p => p.code === c.code)
      )]

  // Group countries by region for display
  const groupedCountries = filteredCountries.reduce((acc, country) => {
    const region = country.region || 'Other'
    if (!acc[region]) {
      acc[region] = []
    }
    acc[region].push(country)
    return acc
  }, {} as Record<string, CountryCode[]>)

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <div className="relative" ref={dropdownRef}>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-[140px] justify-between",
              error && "border-red-500"
            )}
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="flex items-center gap-2 truncate">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="font-medium">{selectedCountry.phoneCode}</span>
            </span>
            <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
          </Button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 mt-2 w-[320px] max-h-[400px] overflow-auto rounded-md border bg-white shadow-lg">
              {/* Search Input */}
              <div className="sticky top-0 bg-white border-b p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search country or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-8"
                  />
                  {searchQuery && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-7 w-7 p-0"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Country List */}
              <div className="max-h-[320px] overflow-y-auto">
                {searchQuery === '' && (
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                    Popular Countries
                  </div>
                )}

                {Object.entries(groupedCountries).map(([region, countries]) => (
                  <div key={region}>
                    {searchQuery !== '' && (
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                        {region}
                      </div>
                    )}
                    {countries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        className={cn(
                          "w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-3",
                          selectedCountry.code === country.code && "bg-blue-50"
                        )}
                        onClick={() => handleCountrySelect(country)}
                      >
                        <span className="text-lg">{country.flag}</span>
                        <span className="flex-1">{country.name}</span>
                        <span className="text-gray-600 font-medium">{country.phoneCode}</span>
                      </button>
                    ))}
                    {searchQuery !== '' && region === Object.keys(groupedCountries)[0] &&
                     popularCountryCodes.length > 0 && (
                      <div className="border-b my-2" />
                    )}
                  </div>
                ))}

                {filteredCountries.length === 0 && (
                  <div className="px-3 py-8 text-center text-gray-500">
                    No countries found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="flex-1">
          <Input
            type="tel"
            placeholder={placeholder}
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            className={cn(
              className,
              error && "border-red-500"
            )}
          />
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-xs text-gray-500">
        Full number: {selectedCountry.phoneCode}{phoneNumber || '...'}
      </div>
    </div>
  )
}