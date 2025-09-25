'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Home, FileText, Users, TrendingUp, Shield, Loader2, Building, CreditCard, Wallet } from 'lucide-react'
import WalletDisplay from '@/components/wallet/wallet-display'
import { RefreshWalletsButton } from '@/components/wallet/refresh-wallets-button'
import { BankAccountDisplay } from '@/components/banking/bank-account-display'
import { StrigaIBANDisplay } from '@/components/banking/striga-iban-display'

interface DashboardData {
  kycStatus: string
  kyc2Status: string
  propertyStats: {
    listedProperties: number
    pendingOffers: number
    activeBuyers: number
    propertiesSold: number
  }
  transactionStats: {
    totalOffers: number
    activeTransactions: number
    completedSales: number
  }
  properties: any[]
  totalProperties: number
  propertiesNeedingKyc2: number
  hasWallets: boolean
  user: {
    emailVerified: boolean
    phoneVerified: boolean
  }
}

export default function SellerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [walletData, setWalletData] = useState<any>(null)
  const [isLoadingWallets, setIsLoadingWallets] = useState(false)
  const [bankAccount, setBankAccount] = useState<any>(null)
  const [mediationSigned, setMediationSigned] = useState<boolean>(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'SELLER') {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchDashboardData()
      fetchMediationStatus()

      // No auto-sync needed - session already has fresh data from database
      // KYC2 status comes from session which fetches from database
    }
  }, [session, status])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/seller/dashboard-data')
      
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
        
        // If KYC2 passed, fetch wallet and bank account data
        if (data.kyc2Status === 'PASSED') {
          fetchBankAccount()
          if (data.hasWallets) {
            fetchWallets()
          }
        }
      } else {
        setError('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Dashboard error:', error)
      setError('Network error loading dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWallets = async () => {
    setIsLoadingWallets(true)
    try {
      const response = await fetch('/api/wallets')
      if (response.ok) {
        const data = await response.json()
        setWalletData(data)
      }
    } catch (error) {
      console.error('Wallet error:', error)
    } finally {
      setIsLoadingWallets(false)
    }
  }

  const fetchBankAccount = async () => {
    try {
      const response = await fetch('/api/user/bank-account')
      if (response.ok) {
        const data = await response.json()
        setBankAccount(data)
      }
    } catch (error) {
      console.error('Error fetching bank account:', error)
    }
  }

  const fetchMediationStatus = async () => {
    try {
      const response = await fetch('/api/user/sign-mediation')
      if (response.ok) {
        const data = await response.json()
        setMediationSigned(data.signed || false)
      }
    } catch (error) {
      console.error('Error fetching mediation status:', error)
    }
  }

  const syncKyc2Status = async () => {
    try {
      console.log('Syncing KYC2 status with Striga...')
      const response = await fetch('/api/kyc2/sync', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        console.log('KYC2 sync response:', data)

        // Update dashboard data if status changed
        if (data.currentStatus && data.currentStatus === 'PASSED') {
          // Refresh dashboard data
          fetchDashboardData()
        }
      }
    } catch (error) {
      console.error('Error syncing KYC2 status:', error)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session || session.user.role !== 'SELLER' || !dashboardData) {
    return null
  }

  const { kycStatus, kyc2Status, propertyStats, transactionStats, properties, totalProperties, propertiesNeedingKyc2 } = dashboardData

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KYC Status Indicator - Always visible at top */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className={`h-6 w-6 ${
                kyc2Status === 'PASSED' ? 'text-green-600' :
                kycStatus === 'PASSED' ? 'text-orange-600' :
                'text-gray-400'
              }`} />
              <div>
                <h3 className="font-semibold text-gray-900">
                  KYC Verification Status
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {kyc2Status === 'PASSED' ? (
                    <span className="text-green-600 font-medium">✅ Tier 1 & Tier 2 Completed - All features unlocked</span>
                  ) : kycStatus === 'PASSED' ? (
                    <span className="text-orange-600 font-medium">⚠️ Tier 1 Completed - Complete Tier 2 to make properties visible</span>
                  ) : kycStatus === 'INITIATED' ? (
                    <span className="text-blue-600 font-medium">⏳ Tier 1 In Progress - Verification pending</span>
                  ) : kycStatus === 'REJECTED' ? (
                    <span className="text-red-600 font-medium">❌ Tier 1 Rejected - Contact support</span>
                  ) : (
                    <span className="text-gray-600 font-medium">⚪ Not Started - Complete Tier 1 to list properties</span>
                  )}
                </p>
              </div>
            </div>
            <div>
              {kyc2Status !== 'PASSED' && kycStatus === 'PASSED' && (
                <Button
                  onClick={() => router.push('/kyc2')}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Complete Tier 2
                </Button>
              )}
              {kycStatus !== 'PASSED' && kycStatus !== 'INITIATED' && kycStatus !== 'REJECTED' && (
                <Button
                  onClick={() => router.push('/kyc')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Start KYC Tier 1
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* KYC2 Alert for Properties - MOST PROMINENT */}
        {kycStatus === 'PASSED' && kyc2Status !== 'PASSED' && propertiesNeedingKyc2 > 0 && (
          <Alert className="mb-6 border-orange-400 bg-gradient-to-r from-orange-50 to-orange-100 shadow-lg">
            <Shield className="h-5 w-5 text-orange-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong className="text-orange-900 text-lg">
                  ⚠️ Your Properties Are Not Visible to Buyers
                </strong>
                <p className="text-orange-800 mt-2">
                  You have <span className="font-bold text-orange-900">{propertiesNeedingKyc2}</span> approved
                  {propertiesNeedingKyc2 === 1 ? ' property' : ' properties'} that cannot be seen by buyers.
                  <br />
                  <span className="font-semibold">Complete KYC Level 2 verification now to make them visible and start receiving offers.</span>
                </p>
              </div>
              <Button onClick={() => router.push('/kyc2')}
                      className="ml-4 bg-orange-600 hover:bg-orange-700 text-white shadow-md"
                      size="lg">
                <Shield className="mr-2 h-5 w-5" />
                Complete Tier 2 Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {session.user.email}</p>
        </div>

        {/* Mediation Agreement Section - Show if KYC2 is completed but mediation not signed */}
        {kyc2Status === 'PASSED' && !mediationSigned && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FileText className="h-6 w-6 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Mediation Agreement Required
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="text-yellow-700 font-medium">
                      ⚠️ You need to sign the mediation agreement to receive offers on your properties
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    This agreement ensures fair dispute resolution for all property transactions
                  </p>
                </div>
              </div>
              <div>
                <Button
                  onClick={() => router.push('/mediation-agreement')}
                  className="bg-yellow-600 hover:bg-yellow-700"
                  size="lg"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Sign Mediation Agreement
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success message if everything is completed */}
        {kyc2Status === 'PASSED' && mediationSigned && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-4">
              <Shield className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Ready to Receive Offers
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="text-green-600 font-medium">
                    ✅ All requirements completed - You can now receive offers on your properties
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
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
          <Card className={kycStatus !== 'PASSED' ? 'opacity-60' : ''}>
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
                    disabled={kycStatus !== 'PASSED'}
                    title={kycStatus !== 'PASSED' ? 'Complete KYC verification to list properties' : ''}
                    onClick={() => router.push('/seller/properties/new')}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    List New Property
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full"
                    disabled={kycStatus !== 'PASSED'}
                    title={kycStatus !== 'PASSED' ? 'Complete KYC verification to manage properties' : ''}
                    onClick={() => router.push('/seller/properties')}
                  >
                    <Building className="mr-2 h-4 w-4" />
                    Manage Properties
                  </Button>
                  
                  {kycStatus === 'PASSED' && (
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

          <Card className={kyc2Status !== 'PASSED' ? 'opacity-60' : ''}>
            <CardHeader>
              <CardTitle>Financial Accounts</CardTitle>
              <CardDescription>Manage your payment accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {kyc2Status === 'PASSED' ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Manage your bank accounts and wallets for receiving payments.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.location.href = '#banking-section'}
                    >
                      <Building className="mr-2 h-4 w-4" />
                      View Banking Details
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.location.href = '#iban-section'}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      View Payment Account
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.location.href = '#wallet-section'}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      View Crypto Wallets
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Account Status:</span>
                    <span className="text-sm text-gray-500">KYC Tier 2 Required</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">KYC Tier 1:</span>
                    <span className={`text-sm ${
                      kycStatus === 'PASSED' ? 'text-green-600 font-medium' :
                      kycStatus === 'REJECTED' ? 'text-red-600' :
                      'text-amber-600'
                    }`}>
                      {kycStatus === 'PASSED' ? 'Approved' :
                       kycStatus === 'REJECTED' ? 'Rejected' :
                       kycStatus === 'INITIATED' ? 'In Review' :
                       'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">KYC Tier 2:</span>
                    <span className={`text-sm ${
                      kyc2Status === 'PASSED' ? 'text-green-600 font-medium' :
                      kyc2Status === 'REJECTED' ? 'text-red-600' :
                      'text-amber-600'
                    }`}>
                      {kyc2Status === 'PASSED' ? 'Approved' :
                       kyc2Status === 'REJECTED' ? 'Rejected' :
                       kyc2Status === 'INITIATED' ? 'In Review' :
                       'Required'}
                    </span>
                  </div>
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Complete KYC Tier 2 verification to access your financial accounts.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial Accounts Sections - Only show if KYC2 is passed */}
        {kyc2Status === 'PASSED' && (
          <>
            {/* Personal Bank Account Section */}
            <div id="banking-section" className="mt-6">
              <BankAccountDisplay
                bankAccount={bankAccount}
                onUpdate={fetchBankAccount}
              />
            </div>

            {/* Striga IBAN Section */}
            <div id="iban-section" className="mt-6">
              <StrigaIBANDisplay
                userRole="SELLER"
                kycStatus={kycStatus}
              />
            </div>

            {/* Crypto Wallets Section */}
            <div id="wallet-section" className="mt-6">
              {walletData ? (
                <WalletDisplay
                  userRole="SELLER"
                  primaryWallet={walletData.primaryWallet}
                  allWallets={walletData.wallets}
                  onRefresh={fetchWallets}
                />
              ) : isLoadingWallets ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Crypto Wallets</CardTitle>
                    <CardDescription>Loading your crypto wallets...</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading wallets...
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Crypto Wallets</CardTitle>
                    <CardDescription>Your cryptocurrency payment wallets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RefreshWalletsButton 
                      onRefresh={fetchWallets}
                      onSyncComplete={() => {
                        fetchDashboardData()
                        fetchWallets()
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Property Listings</CardTitle>
            <CardDescription>Manage your active property listings</CardDescription>
          </CardHeader>
          <CardContent>
            {kycStatus !== 'PASSED' ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">
                  Complete KYC verification to start listing properties.
                </p>
              </div>
            ) : properties.length > 0 ? (
              <div className="space-y-4">
                {properties.map((property) => (
                  <div key={property.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{property.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {property.city}, {property.state} • {property.bedrooms} bed • {property.bathrooms} bath • {property.area}m²
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-lg font-bold text-green-600">€{parseInt(property.price).toLocaleString()}</span>
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
                {totalProperties > 5 && (
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/seller/properties')}
                  >
                    View All Properties ({totalProperties})
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
      <Footer />
    </div>
  )
}