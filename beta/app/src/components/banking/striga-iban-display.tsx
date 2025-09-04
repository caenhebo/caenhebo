'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, Copy, Check, Loader2, AlertCircle } from 'lucide-react'

interface StrigaIBANDisplayProps {
  userRole: 'BUYER' | 'SELLER'
  kycStatus: string
}

interface IBANData {
  iban: string
  bankName: string
  accountNumber?: string
}

export function StrigaIBANDisplay({ userRole, kycStatus }: StrigaIBANDisplayProps) {
  const [ibanData, setIbanData] = useState<IBANData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [autoCreateAttempted, setAutoCreateAttempted] = useState(false)

  useEffect(() => {
    if (kycStatus === 'PASSED') {
      fetchIBAN()
    } else {
      setIsLoading(false)
    }
  }, [kycStatus])

  const fetchIBAN = async () => {
    try {
      const response = await fetch('/api/user/iban')
      if (response.ok) {
        const data = await response.json()
        if (data && data.iban) {
          setIbanData(data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch IBAN:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createIBAN = async () => {
    setIsCreating(true)
    setError('')

    try {
      const response = await fetch('/api/iban/create', {
        method: 'POST'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create IBAN')
      }

      const data = await response.json()
      setIbanData({
        iban: data.iban,
        bankName: data.bankName,
        accountNumber: data.accountNumber
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment account')
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatIBAN = (iban: string | undefined | null): string => {
    if (!iban || typeof iban !== 'string') return 'Not available'
    try {
      const cleaned = iban.replace(/\s/g, '')
      const chunks = cleaned.match(/.{1,4}/g) || []
      return chunks.join(' ')
    } catch (error) {
      console.error('Error formatting IBAN:', error)
      return 'Not available'
    }
  }

  if (kycStatus !== 'PASSED') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>EUR Payment Account (Striga)</CardTitle>
              <CardDescription>Digital IBAN for receiving payments</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Complete KYC verification to create your EUR payment account.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>EUR Payment Account (Striga)</CardTitle>
              <CardDescription>Digital IBAN for receiving payments</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (!ibanData || !ibanData.iban) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>EUR Payment Account (Striga)</CardTitle>
              <CardDescription>Create your digital IBAN for transactions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              {userRole === 'SELLER' 
                ? 'Create a EUR payment account to receive payments from property sales.'
                : 'Create a EUR payment account for making property purchases.'}
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            className="w-full mt-4"
            onClick={createIBAN}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Create EUR Payment Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Safety check - if we somehow reach here without valid data, show create card
  if (!ibanData || !ibanData.iban) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>EUR Payment Account (Striga)</CardTitle>
              <CardDescription>Create your digital IBAN for transactions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              {userRole === 'SELLER' 
                ? 'Create a EUR payment account to receive payments from property sales.'
                : 'Create a EUR payment account for making property purchases.'}
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            className="w-full mt-4"
            onClick={createIBAN}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Create EUR Payment Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Only render if we have valid IBAN data
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>EUR Payment Account (Striga)</CardTitle>
            <CardDescription>Your digital IBAN for transactions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">IBAN</label>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono">{formatIBAN(ibanData.iban)}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(ibanData.iban, 'iban')}
              >
                {copiedField === 'iban' ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {ibanData.bankName && (
            <div>
              <label className="text-sm font-medium text-gray-500">Bank</label>
              <p className="text-sm font-medium">{ibanData.bankName}</p>
            </div>
          )}

          {ibanData.accountNumber && (
            <div>
              <label className="text-sm font-medium text-gray-500">Account Number</label>
              <p className="text-sm font-mono">{ibanData.accountNumber}</p>
            </div>
          )}

          <Alert className="border-green-200 bg-green-50">
            <CreditCard className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              This is your Striga payment account for {userRole === 'SELLER' ? 'receiving' : 'making'} payments.
              {userRole === 'SELLER' && ' Buyers will send funds to this account.'}
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  )
}