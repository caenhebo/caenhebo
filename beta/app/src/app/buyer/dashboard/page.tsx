'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Search, FileText, CreditCard, Home, Shield, Loader2, Building, Wallet, Heart } from 'lucide-react'
import WalletDisplay from '@/components/wallet/wallet-display'
import { RefreshWalletsButton } from '@/components/wallet/refresh-wallets-button'
import { PropertyInterests } from '@/components/buyer/property-interests'
import PropertyOffers from '@/components/buyer/property-offers'
import { BankAccountDisplay } from '@/components/banking/bank-account-display'
import { StrigaIBANDisplay } from '@/components/banking/striga-iban-display'

export default function BuyerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isInitiatingKYC, setIsInitiatingKYC] = useState(false)
  const [kycError, setKycError] = useState('')
  // Payment preference removed - now handled per offer
  const [liveKycStatus, setLiveKycStatus] = useState<string | null>(null)
  const [kyc2Status, setKyc2Status] = useState<string | null>(null)
  const [mediationSigned, setMediationSigned] = useState<boolean>(false)
  const [isCheckingKyc, setIsCheckingKyc] = useState(false)
  const [walletData, setWalletData] = useState<any>(null)
  const [isLoadingWallets, setIsLoadingWallets] = useState(false)
  const [propertyCode, setPropertyCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [transactionStats, setTransactionStats] = useState({
    totalOffers: 0,
    activeTransactions: 0,
    completedPurchases: 0
  })
  const [propertyInterestsCount, setPropertyInterestsCount] = useState(0)
  const [bankAccount, setBankAccount] = useState<any>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'BUYER') {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Use KYC status from session (which comes fresh from database)
      setLiveKycStatus(session.user.kycStatus || null)
      setKyc2Status(session.user.kyc2Status || 'PENDING')
      fetchTransactionStats()
      fetchMediationStatus()

      // No auto-sync needed - session already has fresh data from database
      // Only sync manually when user requests it
    }
  }, [session, status])

  useEffect(() => {
    if (liveKycStatus === 'PASSED') {
      fetchPropertyInterestsCount()
    }
    if (kyc2Status === 'PASSED') {
      fetchWallets()
      fetchBankAccount()
    }
  }, [liveKycStatus, kyc2Status])

  // Removed fetchLiveKycStatus - now using session KYC status directly


  const fetchWallets = async () => {
    setIsLoadingWallets(true)
    try {
      const response = await fetch('/api/wallets')
      if (response.ok) {
        const data = await response.json()
        setWalletData(data)
      } else {
        console.error('Failed to fetch wallets')
      }
    } catch (error) {
      console.error('Error fetching wallets:', error)
    } finally {
      setIsLoadingWallets(false)
    }
  }

  const fetchTransactionStats = async () => {
    try {
      const response = await fetch('/api/transactions?role=buyer')
      if (response.ok) {
        const data = await response.json()
        const transactions = data.transactions || []
        
        const stats = {
          totalOffers: transactions.length,
          activeTransactions: transactions.filter((t: any) => 
            ['OFFER', 'NEGOTIATION', 'AGREEMENT', 'ESCROW', 'CLOSING'].includes(t.status)
          ).length,
          completedPurchases: transactions.filter((t: any) => t.status === 'COMPLETED').length
        }
        
        setTransactionStats(stats)
      }
    } catch (error) {
      console.error('Error fetching transaction stats:', error)
    }
  }

  const fetchBankAccount = async () => {
    try {
      const response = await fetch('/api/user/bank-account')
      if (response.ok) {
        const data = await response.json()
        setBankAccount(data.bankAccount)
      }
    } catch (error) {
      console.error('Bank account error:', error)
    }
  }

  const fetchPropertyInterestsCount = async () => {
    try {
      const response = await fetch('/api/buyer/interests')
      if (response.ok) {
        const data = await response.json()
        setPropertyInterestsCount(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching property interests:', error)
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

        // Update local state if status changed
        if (data.currentStatus && data.currentStatus !== kyc2Status) {
          setKyc2Status(data.currentStatus)

          // If KYC2 just got approved, refresh data (not reload page)
          if (data.currentStatus === 'PASSED') {
            // Refresh transaction stats and other data
            fetchTransactionStats()
            fetchPropertyInterestsCount()
            if (!mediationSigned) {
              fetchMediationStatus()
            }
          }
        }
      }
    } catch (error) {
      console.error('Error syncing KYC2 status:', error)
    }
  }


  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session || session.user.role !== 'BUYER') {
    return null
  }

  const initiateKYC = async () => {
    // Redirect to KYC form page
    router.push('/kyc')
  }

  const handlePropertySearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!propertyCode.trim()) {
      return
    }

    setIsSearching(true)
    try {
      // Navigate to property detail page
      router.push(`/property/${propertyCode.trim().toUpperCase()}`)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {session.user.email}</p>
        </div>

        {/* KYC Status Indicator - Always visible at top */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className={`h-6 w-6 ${
                kyc2Status === 'PASSED' ? 'text-green-600' :
                liveKycStatus === 'PASSED' ? 'text-blue-600' :
                'text-gray-400'
              }`} />
              <div>
                <h3 className="font-semibold text-gray-900">
                  KYC Verification Status
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {kyc2Status === 'PASSED' ? (
                    <span className="text-green-600 font-medium">✅ Tier 1 & Tier 2 Completed - You can make offers on properties</span>
                  ) : liveKycStatus === 'PASSED' ? (
                    <span className="text-orange-600 font-medium">⚠️ Tier 1 Completed - Complete Tier 2 to make offers on properties</span>
                  ) : liveKycStatus === 'INITIATED' ? (
                    <span className="text-blue-600 font-medium">⏳ Tier 1 In Progress - Verification pending</span>
                  ) : liveKycStatus === 'REJECTED' ? (
                    <span className="text-red-600 font-medium">❌ Tier 1 Rejected - Contact support</span>
                  ) : (
                    <span className="text-gray-600 font-medium">⚪ Not Started - Complete Tier 1 to browse and make offers</span>
                  )}
                </p>
              </div>
            </div>
            <div>
              {kyc2Status !== 'PASSED' && liveKycStatus === 'PASSED' && (
                <Button
                  onClick={() => router.push('/kyc2')}
                  className="bg-orange-600 hover:bg-orange-700"
                  size="lg"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Complete Tier 2 to Make Offers
                </Button>
              )}
              {liveKycStatus !== 'PASSED' && liveKycStatus !== 'INITIATED' && liveKycStatus !== 'REJECTED' && (
                <Button
                  onClick={initiateKYC}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Start KYC Tier 1
                </Button>
              )}
            </div>
          </div>
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
                      ⚠️ You need to sign the mediation agreement to make offers on properties
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
                  Ready to Make Offers
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="text-green-600 font-medium">
                    ✅ All requirements completed - You can now make offers on properties
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {kycError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{kycError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => window.location.href = '#interests-section'}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties Shown Interest</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{propertyInterestsCount}</div>
              <p className="text-xs text-muted-foreground">Properties you're interested in</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/transactions?role=buying')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers Made</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionStats.totalOffers}</div>
              <p className="text-xs text-muted-foreground">Total offers submitted</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/transactions?role=buying&status=active')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionStats.activeTransactions}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/transactions?role=buying&status=completed')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties Owned</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionStats.completedPurchases}</div>
              <p className="text-xs text-muted-foreground">Completed purchases</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={liveKycStatus !== 'PASSED' ? 'opacity-60' : ''}>
            <CardHeader>
              <CardTitle>Search Properties</CardTitle>
              <CardDescription>Find your dream property in Portugal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter a property code to view details and make an offer.
                </p>
                <form onSubmit={handlePropertySearch} className="space-y-3">
                  <div>
                    <Label htmlFor="propertyCode">Property Code</Label>
                    <Input
                      id="propertyCode"
                      value={propertyCode}
                      onChange={(e) => setPropertyCode(e.target.value)}
                      placeholder="e.g., CAE-2024-0001"
                      className="mt-1"
                      disabled={liveKycStatus !== 'PASSED'}
                    />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full" 
                    disabled={liveKycStatus !== 'PASSED' || isSearching || !propertyCode.trim()}
                    title={liveKycStatus !== 'PASSED' ? 'Complete KYC verification to search properties' : ''}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search Property
                      </>
                    )}
                  </Button>
                </form>
                
                {liveKycStatus === 'PASSED' && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push('/buyer/properties')}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Browse All Properties
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push('/transactions')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      My Transactions
                    </Button>
                  </div>
                )}
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
                    Manage your bank accounts and wallets. Payment method can be selected when making an offer.
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
                    <span className="text-sm font-medium">KYC Tier 1:</span>
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

        {/* Property Interests Section */}
        <div id="interests-section" className="mt-6">
          {liveKycStatus === 'PASSED' ? (
            <PropertyInterests />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>My Property Interests</CardTitle>
                <CardDescription>Properties you've expressed interest in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">
                    Complete KYC verification to express interest in properties.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* My Property Offers Section */}
        <div className="mt-6">
          {liveKycStatus === 'PASSED' ? (
            <PropertyOffers />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>My Property Offers</CardTitle>
                <CardDescription>Properties you've made offers on</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">
                    Complete KYC verification to make offers on properties.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Banking & Payment Sections - Only show when KYC2 is passed */}
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
                userRole="BUYER"
                kycStatus={liveKycStatus}
              />
            </div>

            {/* Crypto Wallets Section */}
            <div id="wallet-section" className="mt-6">
              {walletData ? (
                <WalletDisplay
                  userRole="BUYER"
                  primaryWallet={walletData.primaryWallet}
                  allWallets={walletData.wallets}
                  onRefresh={fetchWallets}
                />
              ) : isLoadingWallets ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Crypto Wallets</CardTitle>
                    <CardDescription>Loading your cryptocurrency wallets</CardDescription>
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
                    <CardDescription>Your cryptocurrency wallets for property purchases</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RefreshWalletsButton 
                      onRefresh={fetchWallets}
                      onSyncComplete={() => {
                        fetchWallets()
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}