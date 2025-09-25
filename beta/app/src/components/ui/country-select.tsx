'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, Search, X } from 'lucide-react'
import { countries, popularCountries, searchCountriesByName, getCountryByCode } from '@/lib/countries'
import { cn } from '@/lib/utils'

interface CountrySelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function CountrySelect({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = 'Select a country'
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedCountry = getCountryByCode(value)

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

  const handleCountrySelect = (countryCode: string) => {
    onChange(countryCode)
    setIsOpen(false)
    setSearchQuery('')
  }

  const filteredCountries = searchQuery
    ? searchCountriesByName(searchQuery)
    : [...popularCountries, ...countries.filter(c =>
        !popularCountries.find(p => p.code === c.code)
      )]

  // Group countries by region for display
  const groupedCountries = filteredCountries.reduce((acc, country) => {
    const region = country.region || 'Other'
    if (!acc[region]) {
      acc[region] = []
    }
    acc[region].push(country)
    return acc
  }, {} as Record<string, typeof countries[0][]>)

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-between",
          className
        )}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedCountry ? (
            <>
              <span className="text-lg">{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full max-w-[400px] max-h-[400px] overflow-auto rounded-md border bg-white shadow-lg">
          {/* Search Input */}
          <div className="sticky top-0 bg-white border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8"
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSearchQuery('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-[320px] overflow-y-auto">
            {searchQuery === '' && popularCountries.length > 0 && (
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                Popular Countries
              </div>
            )}

            {Object.entries(groupedCountries).map(([region, regionCountries], index) => (
              <div key={region}>
                {(searchQuery !== '' || index > 0) && (
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                    {region}
                  </div>
                )}
                {regionCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    className={cn(
                      "w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-3",
                      selectedCountry?.code === country.code && "bg-blue-50"
                    )}
                    onClick={() => handleCountrySelect(country.code)}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="flex-1">{country.name}</span>
                    <span className="text-xs text-gray-500">{country.code}</span>
                  </button>
                ))}
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
  )
}