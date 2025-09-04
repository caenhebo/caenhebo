'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Copy, Check, Edit, Loader2 } from 'lucide-react'
import { BankAccountForm } from './bank-account-form'

interface BankAccountData {
  accountHolderName: string
  bankName: string
  iban: string
  swiftCode?: string
  bankAddress?: string
  verified: boolean
}

interface BankAccountDisplayProps {
  bankAccount: BankAccountData | null
  onUpdate?: () => void
}

export function BankAccountDisplay({ bankAccount, onUpdate }: BankAccountDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

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
    const cleaned = iban.replace(/\s/g, '')
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(' ')
  }

  if (!bankAccount && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Your Bank Account</CardTitle>
                <CardDescription>Add your bank details to receive payments</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              No bank account added yet. Add your bank details to receive payments directly to your account.
            </AlertDescription>
          </Alert>
          <Button 
            className="w-full mt-4"
            onClick={() => setIsEditing(true)}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Add Bank Account
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isEditing) {
    return (
      <BankAccountForm
        initialData={bankAccount || undefined}
        onSuccess={() => {
          setIsEditing(false)
          if (onUpdate) onUpdate()
        }}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Your Bank Account</CardTitle>
              <CardDescription>Personal bank account for receiving payments</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Account Holder</label>
            <p className="text-sm font-medium">{bankAccount!.accountHolderName}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Bank Name</label>
            <p className="text-sm font-medium">{bankAccount!.bankName}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">IBAN</label>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono">{formatIBAN(bankAccount!.iban)}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankAccount!.iban, 'iban')}
              >
                {copiedField === 'iban' ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {bankAccount!.swiftCode && (
            <div>
              <label className="text-sm font-medium text-gray-500">SWIFT/BIC</label>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono">{bankAccount!.swiftCode}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankAccount!.swiftCode!, 'swift')}
                >
                  {copiedField === 'swift' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {bankAccount!.bankAddress && (
            <div>
              <label className="text-sm font-medium text-gray-500">Bank Address</label>
              <p className="text-sm">{bankAccount!.bankAddress}</p>
            </div>
          )}

          {!bankAccount!.verified && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800">
                Your bank account is pending verification. You'll be notified once verified.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}