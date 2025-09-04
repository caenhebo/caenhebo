'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Building,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  Home,
  CreditCard,
  Activity,
  AlertCircle,
  Loader2,
  Copy
} from 'lucide-react'

interface UserDetails {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  role: string
  kycStatus?: string
  emailVerified: boolean
  phoneVerified: boolean
  strigaUserId?: string
  dateOfBirth?: string
  addressLine1?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  createdAt: string
  updatedAt: string
  profile?: any
  sellerProperties?: any[]
  buyerTransactions?: any[]
  sellerTransactions?: any[]
  wallets?: any[]
  propertyInterests?: any[]
  strigaData?: any
  strigaWallets?: any
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const [user, setUser] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [copiedStrigaId, setCopiedStrigaId] = useState(false)
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (userId) {
      fetchUserDetails()
    }
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch user details')
      }

      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error('Error fetching user:', error)
      setError('Failed to load user details')
    } finally {
      setIsLoading(false)
    }
  }

  const syncWithStriga = async () => {
    if (!user?.strigaUserId) return
    
    try {
      setIsSyncing(true)
      const response = await fetch(`/api/admin/users/${userId}/sync-striga`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Add a small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 500))
        await fetchUserDetails() // Refresh data
        
        // Show success feedback
        setCopiedItems(prev => ({ ...prev, syncSuccess: true }))
        setTimeout(() => {
          setCopiedItems(prev => ({ ...prev, syncSuccess: false }))
        }, 3000)
      } else {
        const errorData = await response.json()
        console.error('Sync failed:', errorData)
        alert(`Sync failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error syncing with Striga:', error)
      alert('Failed to sync with Striga. Please check the console.')
    } finally {
      setIsSyncing(false)
    }
  }

  const getKycStatusBadge = (status?: string) => {
    switch (status) {
      case 'PASSED':
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            KYC Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-4 w-4 mr-1" />
            KYC Rejected
          </Badge>
        )
      case 'INITIATED':
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-4 w-4 mr-1" />
            KYC Pending
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <AlertCircle className="h-4 w-4 mr-1" />
            No KYC
          </Badge>
        )
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <Shield className="h-4 w-4 mr-1" />
            Admin
          </Badge>
        )
      case 'SELLER':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Building className="h-4 w-4 mr-1" />
            Seller
          </Badge>
        )
      case 'BUYER':
        return (
          <Badge className="bg-indigo-100 text-indigo-800">
            <User className="h-4 w-4 mr-1" />
            Buyer
          </Badge>
        )
      default:
        return <Badge>{role}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount)
  }

  const copyToClipboard = async (text: string, itemKey: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "absolute"
        textArea.style.left = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
        } finally {
          textArea.remove()
        }
      }
      setCopiedItems(prev => ({ ...prev, [itemKey]: true }))
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [itemKey]: false }))
      }, 2000)
      return true
    } catch (error) {
      console.error('Failed to copy:', error)
      return false
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Alert variant="destructive">
          <AlertDescription>{error || 'User not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin?tab=users')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-2xl font-bold">User Details</h1>
          </div>
          {user.strigaUserId && (
            <Button
              onClick={syncWithStriga}
              disabled={isSyncing}
              variant={copiedItems['syncSuccess'] ? 'default' : 'outline'}
              className={copiedItems['syncSuccess'] ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : copiedItems['syncSuccess'] ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Synced Successfully!
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync with Striga
                </>
              )}
            </Button>
          )}
        </div>

        {/* User Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {user.firstName || user.lastName 
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : 'No Name'
                  }
                </CardTitle>
                <CardDescription className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                  {user.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {user.phoneNumber}
                    </div>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {getRoleBadge(user.role)}
                {getKycStatusBadge(user.kycStatus)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Account Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Email Verified</span>
                    {user.emailVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Phone Verified</span>
                    {user.phoneVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  {user.strigaUserId && (
                    <div className="text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Striga ID</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1"
                          title="Copy Striga ID"
                          onClick={() => copyToClipboard(user.strigaUserId!, 'strigaId')}
                        >
                          {copiedItems['strigaId'] ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div 
                        className="font-mono text-xs bg-gray-100 p-2 rounded break-all cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => copyToClipboard(user.strigaUserId!, 'strigaId')}
                        title="Click to copy"
                      >
                        {user.strigaUserId}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Timestamps</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Joined:</span>
                    <div>{formatDate(user.createdAt)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <div>{formatDate(user.updatedAt)}</div>
                  </div>
                </div>
              </div>

              {(user.addressLine1 || user.city || user.country) && (
                <div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  <div className="text-sm space-y-1">
                    {user.addressLine1 && <div>{user.addressLine1}</div>}
                    {(user.city || user.state) && (
                      <div>{[user.city, user.state].filter(Boolean).join(', ')}</div>
                    )}
                    {user.postalCode && <div>{user.postalCode}</div>}
                    {user.country && <div>{user.country}</div>}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for detailed information */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Info</TabsTrigger>
            {user.role === 'SELLER' && <TabsTrigger value="properties">Properties</TabsTrigger>}
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Activity Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {user.role === 'SELLER' && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Home className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{user.sellerProperties?.length || 0}</div>
                      <div className="text-sm text-gray-600">Properties Listed</div>
                    </div>
                  )}
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {(user.buyerTransactions?.length || 0) + (user.sellerTransactions?.length || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Transactions</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Wallet className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{user.wallets?.length || 0}</div>
                    <div className="text-sm text-gray-600">Wallets</div>
                  </div>
                  {user.role === 'BUYER' && (
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <FileText className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{user.propertyInterests?.length || 0}</div>
                      <div className="text-sm text-gray-600">Property Interests</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Information (KYC Data)</CardTitle>
                <CardDescription>
                  Personal information submitted during KYC verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.strigaData ? (
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div>
                      <h3 className="font-semibold mb-3">Personal Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Full Name</span>
                          <p className="font-medium">
                            {user.strigaData.firstName || user.firstName} {user.strigaData.lastName || user.lastName}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Date of Birth</span>
                          <p className="font-medium">
                            {user.strigaData.dateOfBirth || user.dateOfBirth || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Nationality</span>
                          <p className="font-medium">
                            {user.strigaData.nationality || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Occupation</span>
                          <p className="font-medium">
                            {user.strigaData.occupation || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h3 className="font-semibold mb-3">Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Email</span>
                          <p className="font-medium">
                            {user.strigaData.email || user.email}
                            {user.strigaData.email?.verified && (
                              <CheckCircle className="inline-block ml-2 h-4 w-4 text-green-600" />
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Phone Number</span>
                          <p className="font-medium">
                            {user.strigaData.mobile?.phoneNumber || user.phoneNumber || 'Not provided'}
                            {user.strigaData.mobile?.verified && (
                              <CheckCircle className="inline-block ml-2 h-4 w-4 text-green-600" />
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* KYC Information */}
                    <div>
                      <h3 className="font-semibold mb-3">KYC Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">KYC Status</span>
                          <p className="font-medium">
                            {user.strigaData.KYC?.status || 'Not started'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">KYC Date</span>
                          <p className="font-medium">
                            {user.strigaData.KYC?.dateApproved 
                              ? formatDate(user.strigaData.KYC.dateApproved)
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Expected Monthly Volume</span>
                          <p className="font-medium">
                            {user.strigaData.expectedIncomingTxVolumeYearly 
                              ? formatCurrency(user.strigaData.expectedIncomingTxVolumeYearly / 12)
                              : 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Purpose of Account</span>
                          <p className="font-medium">
                            {user.strigaData.purposeOfAccount || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div>
                      <h3 className="font-semibold mb-3">Registered Address</h3>
                      <div className="space-y-2">
                        <p className="font-medium">
                          {user.strigaData.address?.addressLine1 || user.addressLine1 || 'No address provided'}
                        </p>
                        {(user.strigaData.address?.addressLine2 || user.strigaData.address?.city) && (
                          <p className="text-sm text-gray-600">
                            {[
                              user.strigaData.address?.addressLine2,
                              user.strigaData.address?.city || user.city,
                              user.strigaData.address?.state || user.state,
                              user.strigaData.address?.postalCode || user.postalCode
                            ].filter(Boolean).join(', ')}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {user.strigaData.address?.country || user.country || 'Country not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No Striga data available for this user</p>
                    {user.strigaUserId && (
                      <Button
                        onClick={syncWithStriga}
                        disabled={isSyncing}
                        className="mt-4"
                        variant="outline"
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync Striga Data
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === 'SELLER' && (
            <TabsContent value="properties" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Listed Properties</CardTitle>
                  <CardDescription>
                    All properties listed by this seller
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.sellerProperties && user.sellerProperties.length > 0 ? (
                    <div className="space-y-4">
                      {user.sellerProperties.map((property: any) => (
                        <div key={property.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{property.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {property.city}, {property.country} • {property.bedrooms} bed • {property.bathrooms} bath
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-lg font-bold text-green-600">
                                  {formatCurrency(property.price)}
                                </span>
                                <Badge variant={property.complianceStatus === 'APPROVED' ? 'default' : 'secondary'}>
                                  {property.complianceStatus}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/properties/${property.id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No properties listed</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  All transactions involving this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                {((user.buyerTransactions?.length || 0) + (user.sellerTransactions?.length || 0)) > 0 ? (
                  <div className="space-y-4">
                    {/* Buyer Transactions */}
                    {user.buyerTransactions && user.buyerTransactions.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">As Buyer</h4>
                        {user.buyerTransactions.map((transaction: any) => (
                          <div key={transaction.id} className="border rounded-lg p-4 mb-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{transaction.property?.title || 'Property'}</p>
                                <p className="text-sm text-gray-600">
                                  {formatCurrency(transaction.offerAmount)} • {transaction.status}
                                </p>
                              </div>
                              <Badge>{transaction.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Seller Transactions */}
                    {user.sellerTransactions && user.sellerTransactions.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">As Seller</h4>
                        {user.sellerTransactions.map((transaction: any) => (
                          <div key={transaction.id} className="border rounded-lg p-4 mb-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{transaction.property?.title || 'Property'}</p>
                                <p className="text-sm text-gray-600">
                                  {formatCurrency(transaction.offerAmount)} • {transaction.status}
                                </p>
                              </div>
                              <Badge>{transaction.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No transactions found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallets" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Wallets & Payment Methods</CardTitle>
                <CardDescription>
                  User's wallets from database and Striga
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Database Wallets */}
                  <div>
                    <h3 className="font-semibold mb-3">Platform Wallets</h3>
                    {user.wallets && user.wallets.length > 0 ? (
                      <div className="space-y-3">
                        {user.wallets.map((wallet: any) => (
                          <div key={wallet.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-5 w-5 text-gray-600" />
                                  <span className="font-medium">{wallet.currency} Wallet</span>
                                  {wallet.primary && <Badge variant="secondary">Primary</Badge>}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  Balance: {formatCurrency(wallet.balance || 0)}
                                </p>
                                {wallet.iban && (
                                  <p className="text-sm font-mono mt-1">IBAN: {wallet.iban}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No platform wallets created</p>
                    )}
                  </div>

                  {/* Striga Wallets */}
                  {user.strigaWallets && (
                    <div>
                      <h3 className="font-semibold mb-3">Striga Wallets</h3>
                      {user.strigaWallets.wallets && user.strigaWallets.wallets.length > 0 ? (
                        <div className="space-y-3">
                          {user.strigaWallets.wallets.map((wallet: any) => (
                            <div key={wallet.walletId} className="border rounded-lg p-4 bg-blue-50">
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-blue-600" />
                                    <span className="font-medium">{wallet.currency} Wallet</span>
                                    <Badge className="bg-blue-100 text-blue-800">Striga</Badge>
                                  </div>
                                  <Badge variant={wallet.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                    {wallet.status}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Available Balance</span>
                                    <p className="font-medium">
                                      {wallet.balances?.availableBalance 
                                        ? `${wallet.balances.availableBalance} ${wallet.currency}`
                                        : '0.00'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Total Balance</span>
                                    <p className="font-medium">
                                      {wallet.balances?.totalBalance 
                                        ? `${wallet.balances.totalBalance} ${wallet.currency}`
                                        : '0.00'}
                                    </p>
                                  </div>
                                </div>

                                {wallet.accounts?.IBAN && (
                                  <div className="bg-white rounded p-3 space-y-2">
                                    <h4 className="font-medium text-sm">IBAN Account</h4>
                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-500">IBAN:</span>
                                        <div className="flex items-center gap-2">
                                          <p className="font-mono text-xs">{wallet.accounts.IBAN.iban}</p>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-1"
                                            title="Copy IBAN"
                                            onClick={() => copyToClipboard(wallet.accounts.IBAN.iban, `iban-${wallet.walletId}`)}
                                          >
                                            {copiedItems[`iban-${wallet.walletId}`] ? (
                                              <CheckCircle className="h-3 w-3 text-green-600" />
                                            ) : (
                                              <Copy className="h-3 w-3" />
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">BIC:</span>
                                        <p className="font-mono text-xs">{wallet.accounts.IBAN.bic}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Account Number:</span>
                                        <p className="font-mono text-xs">{wallet.accounts.IBAN.accountNumber}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {wallet.blockchainAddress && (
                                  <div>
                                    <span className="text-gray-500 text-sm">Blockchain Address:</span>
                                    <p className="font-mono text-xs break-all">{wallet.blockchainAddress.address}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No Striga wallets found</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}