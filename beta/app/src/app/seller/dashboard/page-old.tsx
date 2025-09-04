'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Home, FileText, Users, TrendingUp, Shield, Loader2, Building } from 'lucide-react'
import WalletDisplay from '@/components/wallet/wallet-display'

export default function SellerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isInitiatingKYC, setIsInitiatingKYC] = useState(false)
  const [kycError, setKycError] = useState('')
  const [liveKycStatus, setLiveKycStatus] = useState<string | null>(null)
  const [isCheckingKyc, setIsCheckingKyc] = useState(true)
  const [walletData, setWalletData] = useState<any>(null)
  const [isLoadingWallets, setIsLoadingWallets] = useState(false)
  const [walletError, setWalletError] = useState<string>('')
  const [propertyStats, setPropertyStats] = useState({
    listedProperties: 0,
    pendingOffers: 0,
    activeBuyers: 0,
    propertiesSold: 0
  })
  const [transactionStats, setTransactionStats] = useState({
    totalOffers: 0,
    activeTransactions: 0,
    completedSales: 0
  })
  const [properties, setProperties] = useState<any[]>([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'SELLER') {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchLiveKycStatus()
    }
  }, [session, status])

  useEffect(() => {
    if (liveKycStatus === 'PASSED') {
      fetchWallets()
      fetchPropertyStats()
      fetchTransactionStats()
    }
  }, [liveKycStatus])

  const fetchLiveKycStatus = async () => {
    try {
      setIsCheckingKyc(true)
      console.log('[Seller Dashboard] Fetching live KYC status...')
      
      const response = await fetch('/api/kyc/status')
      if (response.ok) {
        const data = await response.json()
        console.log('[Seller Dashboard] KYC status:', data.kycStatus)
        setLiveKycStatus(data.kycStatus)
      } else {
        console.error('[Seller Dashboard] Failed to fetch KYC status:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        })
        setLiveKycStatus(session?.user.kycStatus || null)
      }
    } catch (error) {
      console.error('[Seller Dashboard] Error fetching KYC status:', error)
      setLiveKycStatus(session?.user.kycStatus || null)
    } finally {
      setIsCheckingKyc(false)
    }
  }

  const fetchWallets = async () => {
    setIsLoadingWallets(true)
    setWalletError('')
    try {
      console.log('[Seller Dashboard] Fetching wallets...')
      const response = await fetch('/api/wallets')
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Seller Dashboard] Wallets fetched successfully:', data)
        setWalletData(data)
      } else {
        const errorData = await response.json()
        console.error('[Seller Dashboard] Failed to fetch wallets:', {
          status: response.status,
          error: errorData
        })
        
        let errorMessage = 'Failed to fetch wallets'
        if (response.status === 401) {
          errorMessage = 'Authentication required. Please sign in again.'
        } else if (response.status === 400) {
          if (errorData.kycStatus) {
            errorMessage = `KYC verification required. Status: ${errorData.kycStatus}`
          } else {
            errorMessage = errorData.error || 'Bad request'
          }
        } else {
          errorMessage = errorData.error || `Server error (${response.status})`
        }
        
        setWalletError(errorMessage)
      }
    } catch (error) {
      console.error('[Seller Dashboard] Error fetching wallets:', error)
      setWalletError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoadingWallets(false)
    }
  }

  const fetchPropertyStats = async () => {
    try {
      setIsLoadingProperties(true)
      const response = await fetch('/api/properties')
      if (response.ok) {
        const data = await response.json()
        const fetchedProperties = data.properties || []
        
        // Store properties for display
        setProperties(fetchedProperties)
        
        setPropertyStats({
          listedProperties: fetchedProperties.length,
          pendingOffers: fetchedProperties.reduce((sum: number, p: any) => sum + (p.transactionCount || 0), 0),
          activeBuyers: fetchedProperties.reduce((sum: number, p: any) => sum + (p.interestCount || 0), 0),
          propertiesSold: fetchedProperties.filter((p: any) => p.transactionCount > 0).length
        })
      }
    } catch (error) {
      console.error('Error fetching property stats:', error)
    } finally {
      setIsLoadingProperties(false)
    }
  }

  const fetchTransactionStats = async () => {
    try {
      const response = await fetch('/api/transactions?role=seller')
      if (response.ok) {
        const data = await response.json()
        const transactions = data.transactions || []
        
        const stats = {
          totalOffers: transactions.length,
          activeTransactions: transactions.filter((t: any) => 
            ['OFFER', 'NEGOTIATION', 'AGREEMENT', 'ESCROW', 'CLOSING'].includes(t.status)
          ).length,
          completedSales: transactions.filter((t: any) => t.status === 'COMPLETED').length
        }
        
        setTransactionStats(stats)
      }
    } catch (error) {
      console.error('Error fetching transaction stats:', error)
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session || session.user.role !== 'SELLER') {
    return null
  }

  const initiateKYC = async () => {
    // Redirect to KYC form page
    router.push('/kyc')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {session.user.email}</p>
        </div>

        {/* KYC Alert - Only show if not checking and not approved */}
        {!isCheckingKyc && liveKycStatus !== 'PASSED' && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong className="text-amber-900">
                  {liveKycStatus === 'REJECTED' 
                    ? 'KYC Verification Required'
                    : 'Complete your KYC to start selling properties'}
                </strong>
                <p className="text-sm text-amber-700 mt-1">
                  {liveKycStatus === 'INITIATED' 
                    ? 'Your KYC verification is in progress. This usually takes a few minutes.'
                    : liveKycStatus === 'REJECTED'
                    ? 'Please contact support to resolve your KYC verification.'
                    : 'Verify your identity to list properties and receive payments through digital IBAN.'}
                </p>
              </div>
              {liveKycStatus !== 'INITIATED' && liveKycStatus !== 'REJECTED' && (
                <Button 
                  onClick={initiateKYC}
                  disabled={isInitiatingKYC}
                  className="ml-4"
                >
                  {isInitiatingKYC ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting KYC...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Start KYC Verification
                    </>
                  )}
                </Button>
              )}
              {liveKycStatus === 'INITIATED' && (
                <Button 
                  onClick={fetchLiveKycStatus}
                  disabled={isCheckingKyc}
                  variant="outline"
                  className="ml-4"
                >
                  {isCheckingKyc ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check Status'
                  )}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {kycError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{kycError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/seller/properties')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Listed Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{propertyStats.listedProperties}</div>
              <p className="text-xs text-muted-foreground">Active listings</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/transactions?role=selling')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers Received</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionStats.totalOffers}</div>
              <p className="text-xs text-muted-foreground">Total offers</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/transactions?role=selling&status=active')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionStats.activeTransactions}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/transactions?role=selling&status=completed')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties Sold</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionStats.completedSales}</div>
              <p className="text-xs text-muted-foreground">Completed sales</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={liveKycStatus !== 'PASSED' ? 'opacity-60' : ''}>
            <CardHeader>
              <CardTitle>List a Property</CardTitle>
              <CardDescription>Start the property compliance process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Complete property compliance and list your property for sale.
                </p>
                <div className="space-y-3">
                  <Button 
                    className="w-full"
                    disabled={liveKycStatus !== 'PASSED'}
                    title={liveKycStatus !== 'PASSED' ? 'Complete KYC verification to list properties' : ''}
                    onClick={() => router.push('/seller/properties/new')}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    List New Property
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full"
                    disabled={liveKycStatus !== 'PASSED'}
                    title={liveKycStatus !== 'PASSED' ? 'Complete KYC verification to manage properties' : ''}
                    onClick={() => router.push('/seller/properties')}
                  >
                    <Building className="mr-2 h-4 w-4" />
                    Manage Properties
                  </Button>
                  
                  {liveKycStatus === 'PASSED' && (
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/transactions')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      My Transactions
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className={liveKycStatus !== 'PASSED' ? 'opacity-60' : ''}>
            {liveKycStatus === 'PASSED' && (
              <div>
                {isLoadingWallets ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Payment Account</CardTitle>
                      <CardDescription>Loading your EUR account and banking details</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center py-8">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading wallets...
                    </CardContent>
                  </Card>
                ) : walletData ? (
                  <WalletDisplay
                    userRole="SELLER"
                    primaryWallet={walletData.primaryWallet}
                    allWallets={walletData.wallets}
                    onRefresh={fetchWallets}
                  />
                ) : walletError ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Payment Account</CardTitle>
                      <CardDescription>Error loading your EUR account</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-8">
                      <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{walletError}</AlertDescription>
                      </Alert>
                      <Button 
                        onClick={fetchWallets}
                        disabled={isLoadingWallets}
                        variant="outline"
                      >
                        {isLoadingWallets ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          'Retry Loading Wallets'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Payment Account</CardTitle>
                      <CardDescription>Your EUR account with banking details</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-8">
                      <Building className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                      <div className="space-y-4">
                        <div>
                          <p className="text-lg font-medium text-gray-900 mb-2">
                            Set Up Your Payment Account
                          </p>
                          <p className="text-sm text-gray-600">
                            Your KYC is approved! Create your EUR account to start receiving payments from buyers.
                          </p>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">KYC Status:</span>
                            <span className="text-sm text-green-600 font-semibold flex items-center">
                              <Shield className="h-4 w-4 mr-1" />
                              Approved
                            </span>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={async () => {
                            setIsLoadingWallets(true)
                            try {
                              // Create EUR wallet/IBAN
                              const response = await fetch('/api/iban/create', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                              })
                              
                              if (response.ok) {
                                // Refresh wallets after creation
                                setTimeout(() => {
                                  fetchWallets()
                                }, 2000)
                              } else {
                                console.error('Failed to create payment account')
                              }
                            } catch (error) {
                              console.error('Error creating payment account:', error)
                            }
                          }}
                          disabled={isLoadingWallets}
                          className="w-full"
                        >
                          {isLoadingWallets ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Setting up account...
                            </>
                          ) : (
                            <>
                              <Building className="mr-2 h-4 w-4" />
                              Set Up EUR Payment Account
                            </>
                          )}
                        </Button>
                        
                        <p className="text-xs text-gray-500">
                          This will create your EUR account with full banking details (IBAN, BIC) for receiving payments.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {liveKycStatus !== 'PASSED' && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Payment Account</CardTitle>
                  <CardDescription>Receive payments directly via EUR account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Account Status:</span>
                      <span className="text-sm text-gray-500">KYC Required</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">KYC Status:</span>
                      <span className={`text-sm ${
                        liveKycStatus === 'PASSED' ? 'text-green-600 font-medium' : 
                        liveKycStatus === 'REJECTED' ? 'text-red-600' : 
                        'text-amber-600'
                      }`}>
                        {liveKycStatus === 'PASSED' ? 'Approved' : 
                         liveKycStatus === 'REJECTED' ? 'Rejected' : 
                         liveKycStatus === 'INITIATED' ? 'In Review' : 
                         'Pending'}
                      </span>
                    </div>
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Complete KYC verification to access your EUR payment account with full banking details.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Property Listings</CardTitle>
            <CardDescription>Manage your active property listings</CardDescription>
          </CardHeader>
          <CardContent>
            {liveKycStatus !== 'PASSED' ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">
                  Complete KYC verification to start listing properties.
                </p>
              </div>
            ) : isLoadingProperties ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-500">Loading properties...</p>
              </div>
            ) : properties.length > 0 ? (
              <div className="space-y-4">
                {properties.slice(0, 5).map((property) => (
                  <div key={property.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{property.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {property.city}, {property.state} • {property.bedrooms} bed • {property.bathrooms} bath • {property.area}m²
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-lg font-bold text-green-600">€{property.price.toLocaleString()}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            property.listingStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            property.listingStatus === 'SOLD' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {property.listingStatus}
                          </span>
                          {property.interestCount > 0 && (
                            <span className="text-sm text-gray-500">
                              {property.interestCount} interested
                            </span>
                          )}
                          {property.transactionCount > 0 && (
                            <span className="text-sm text-gray-500">
                              {property.transactionCount} offers
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/seller/properties/${property.id}`)}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
                {properties.length > 5 && (
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/seller/properties')}
                  >
                    View All Properties ({properties.length})
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No properties listed yet. Click "List New Property" to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}