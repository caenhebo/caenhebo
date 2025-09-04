'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Shield, 
  User, 
  Mail, 
  Calendar,
  Trash2,
  Plus,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface DocumentAccess {
  id: string
  buyer: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  grantedAt: string
  expiresAt: string | null
  message: string | null
}

interface DocumentAccessManagerProps {
  propertyId: string
  propertyCode: string
}

export function DocumentAccessManager({ propertyId, propertyCode }: DocumentAccessManagerProps) {
  const [accessList, setAccessList] = useState<DocumentAccess[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGranting, setIsGranting] = useState(false)
  const [showGrantForm, setShowGrantForm] = useState(false)
  const [buyerEmail, setBuyerEmail] = useState('')
  const [message, setMessage] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('0')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [revokeId, setRevokeId] = useState<string | null>(null)

  useEffect(() => {
    fetchAccessList()
  }, [propertyId])

  const fetchAccessList = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/properties/${propertyId}/document-access`)
      
      if (response.ok) {
        const data = await response.json()
        setAccessList(data.accessList)
      } else {
        console.error('Failed to fetch access list')
      }
    } catch (error) {
      console.error('Error fetching access list:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsGranting(true)

    try {
      const response = await fetch(`/api/properties/${propertyId}/document-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerEmail,
          message: message || undefined,
          expiresInDays: parseInt(expiresInDays) || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Document access granted successfully')
        setAccessList([data.documentAccess, ...accessList])
        setBuyerEmail('')
        setMessage('')
        setExpiresInDays('0')
        setShowGrantForm(false)
      } else {
        setError(data.error || 'Failed to grant access')
      }
    } catch (error) {
      setError('Failed to grant access')
    } finally {
      setIsGranting(false)
    }
  }

  const handleRevokeAccess = async (buyerId: string) => {
    try {
      const response = await fetch(
        `/api/properties/${propertyId}/document-access?buyerId=${buyerId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setAccessList(accessList.filter(access => access.buyer.id !== buyerId))
        setSuccess('Document access revoked successfully')
      } else {
        setError('Failed to revoke access')
      }
    } catch (error) {
      setError('Failed to revoke access')
    } finally {
      setRevokeId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Document Access Control
            </CardTitle>
            <CardDescription>
              Manage which buyers can view property documents
            </CardDescription>
          </div>
          <Button onClick={() => setShowGrantForm(!showGrantForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Grant Access
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {showGrantForm && (
          <form onSubmit={handleGrantAccess} className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-4">Grant Document Access</h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="buyerEmail">Buyer Email</Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="buyer@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a note for the buyer..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="expires">Access Duration</Label>
                <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No expiration</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isGranting}>
                  {isGranting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Granting...
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Grant Access
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowGrantForm(false)
                    setBuyerEmail('')
                    setMessage('')
                    setExpiresInDays('0')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : accessList.length === 0 ? (
          <div className="text-center py-8">
            <Lock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No buyers have document access yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Grant access to interested buyers to share property documents
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accessList.map((access) => (
              <div
                key={access.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {access.buyer.firstName} {access.buyer.lastName}
                      </p>
                      {isExpired(access.expiresAt) && (
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {access.buyer.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Granted {formatDate(access.grantedAt)}
                      </span>
                      {access.expiresAt && (
                        <span className="text-amber-600">
                          Expires {formatDate(access.expiresAt)}
                        </span>
                      )}
                    </div>
                    {access.message && (
                      <p className="text-sm text-gray-600 mt-1 italic">"{access.message}"</p>
                    )}
                  </div>
                </div>

                <AlertDialog open={revokeId === access.buyer.id} onOpenChange={(open) => !open && setRevokeId(null)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRevokeId(access.buyer.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke Document Access</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to revoke document access for {access.buyer.firstName} {access.buyer.lastName}?
                        They will no longer be able to view property documents.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRevokeAccess(access.buyer.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Revoke Access
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}