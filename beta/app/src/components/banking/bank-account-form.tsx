'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Building2, CheckCircle } from 'lucide-react'

interface BankAccountFormProps {
  initialData?: {
    accountHolderName: string
    bankName: string
    iban: string
    swiftCode?: string
    bankAddress?: string
  }
  onSuccess?: () => void
}

export function BankAccountForm({ initialData, onSuccess }: BankAccountFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    accountHolderName: initialData?.accountHolderName || '',
    bankName: initialData?.bankName || '',
    iban: initialData?.iban || '',
    swiftCode: initialData?.swiftCode || '',
    bankAddress: initialData?.bankAddress || ''
  })

  const validateIBAN = (iban: string): boolean => {
    // Basic IBAN validation - remove spaces and check length
    const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()
    
    // Check if it starts with 2 letters and has the right length for common countries
    if (!/^[A-Z]{2}[0-9]{2}/.test(cleanIBAN)) {
      return false
    }
    
    // Common IBAN lengths
    const ibanLengths: { [key: string]: number } = {
      'PT': 25, 'ES': 24, 'FR': 27, 'DE': 22, 'IT': 27,
      'NL': 18, 'BE': 16, 'AT': 20, 'IE': 22, 'GB': 22
    }
    
    const countryCode = cleanIBAN.substring(0, 2)
    const expectedLength = ibanLengths[countryCode]
    
    if (expectedLength && cleanIBAN.length !== expectedLength) {
      return false
    }
    
    return true
  }

  const formatIBAN = (value: string): string => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    
    // Add spaces every 4 characters
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(' ')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validate required fields
    if (!formData.accountHolderName.trim()) {
      setError('Account holder name is required')
      return
    }

    if (!formData.bankName.trim()) {
      setError('Bank name is required')
      return
    }

    if (!formData.iban.trim()) {
      setError('IBAN is required')
      return
    }

    if (!validateIBAN(formData.iban)) {
      setError('Invalid IBAN format')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/bank-account', {
        method: initialData ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          iban: formData.iban.replace(/\s/g, '').toUpperCase() // Clean IBAN before saving
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save bank account')
      }

      setSuccess(true)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bank account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <CardTitle>Bank Account Details</CardTitle>
        </div>
        <CardDescription>
          Add your personal bank account for receiving payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Bank account details saved successfully!
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="accountHolderName">Account Holder Name</Label>
            <Input
              id="accountHolderName"
              value={formData.accountHolderName}
              onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
              placeholder="John Doe"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Name as it appears on your bank account
            </p>
          </div>

          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              placeholder="Banco Santander"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={formData.iban}
              onChange={(e) => {
                const formatted = formatIBAN(e.target.value)
                if (formatted.length <= 35) { // Max IBAN length with spaces
                  setFormData({ ...formData, iban: formatted })
                }
              }}
              placeholder="PT50 0000 0000 0000 0000 0000 0"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              International Bank Account Number
            </p>
          </div>

          <div>
            <Label htmlFor="swiftCode">SWIFT/BIC Code (Optional)</Label>
            <Input
              id="swiftCode"
              value={formData.swiftCode}
              onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value.toUpperCase() })}
              placeholder="BSCHPTPL"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              8 or 11 character code
            </p>
          </div>

          <div>
            <Label htmlFor="bankAddress">Bank Address (Optional)</Label>
            <Input
              id="bankAddress"
              value={formData.bankAddress}
              onChange={(e) => setFormData({ ...formData, bankAddress: e.target.value })}
              placeholder="123 Bank Street, Lisbon, Portugal"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Building2 className="mr-2 h-4 w-4" />
                {initialData ? 'Update Bank Account' : 'Save Bank Account'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}