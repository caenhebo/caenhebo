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

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'SELLER') {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchDashboardData()
    }
  }, [session, status])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/seller/dashboard-data')
      
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
        
        // If KYC passed, fetch wallet and bank account data
        if (data.kycStatus === 'PASSED') {
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

  const { kycStatus, propertyStats, transactionStats, properties, totalProperties } = dashboardData

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {session.user.email}</p>
        </div>

        {/* KYC Alert */}
        {kycStatus !== 'PASSED' && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong className="text-amber-900">
                  {kycStatus === 'REJECTED' 
                    ? 'KYC Verification Required'
                    : 'Complete your KYC to start selling properties'}
                </strong>
                <p className="text-sm text-amber-700 mt-1">
                  {kycStatus === 'INITIATED' 
                    ? 'Your KYC verification is in progress. This usually takes a few minutes.'
                    : kycStatus === 'REJECTED'
                    ? 'Please contact support to resolve your KYC verification.'
                    : 'Verify your identity to list properties and receive payments through digital IBAN.'}
                </p>
              </div>
              {kycStatus !== 'INITIATED' && kycStatus !== 'REJECTED' && (
                <Button onClick={() => router.push('/kyc')} className="ml-4">
                  <Shield className="mr-2 h-4 w-4" />
                  Start KYC Verification
                </Button>
              )}
              {kycStatus === 'INITIATED' && (
                <Button 
                  onClick={fetchDashboardData}
                  variant="outline"
                  className="ml-4"
                >
                  Check Status
                </Button>
              )}
            </AlertDescription>
          </Alert>
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

          <Card className={kycStatus !== 'PASSED' ? 'opacity-60' : ''}>
            <CardHeader>
              <CardTitle>Financial Accounts</CardTitle>
              <CardDescription>Manage your payment accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {kycStatus === 'PASSED' ? (
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
                    <span className="text-sm text-gray-500">KYC Required</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">KYC Status:</span>
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
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Complete KYC verification to access your financial accounts.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial Accounts Sections - Only show if KYC is passed */}
        {kycStatus === 'PASSED' && (
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