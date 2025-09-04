'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Copy, CreditCard, Bitcoin, Eye, EyeOff, Wallet, Building } from 'lucide-react'
import { RefreshWalletsButton } from './refresh-wallets-button'

interface WalletBalance {
  currency: string
  walletId: string
  accountId?: string
  address: string
  qrCode?: string
  network?: string
  balance: {
    amount: string
    currency: string
  }
  type: 'crypto' | 'fiat'
}

interface BankingDetails {
  iban: string
  bic: string
  bankName: string
  accountHolderName: string
  bankAddress?: string
}

interface WalletDisplayProps {
  userRole: 'BUYER' | 'SELLER'
  primaryWallet?: WalletBalance
  allWallets: WalletBalance[]
  onRefresh?: () => void
}

export default function WalletDisplay({ userRole, primaryWallet, allWallets, onRefresh }: WalletDisplayProps) {
  const [showAllWallets, setShowAllWallets] = useState(false)
  const [showBalance, setShowBalance] = useState(false)
  const [showAddresses, setShowAddresses] = useState<Record<string, boolean>>({})
  const [bankingDetails, setBankingDetails] = useState<BankingDetails | null>(null)
  const [loadingBankingDetails, setLoadingBankingDetails] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState('')
  const [showWalletDetails, setShowWalletDetails] = useState<Record<string, boolean>>({})

  const copyToClipboard = async (text: string, label: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for non-HTTPS contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          document.execCommand('copy')
        } catch (err) {
          console.error('Fallback copy failed:', err)
          throw err
        }
        
        document.body.removeChild(textArea)
      }
      
      setCopiedAddress(label)
      setTimeout(() => setCopiedAddress(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      // Show user feedback that copy failed
      setCopiedAddress(`Failed to copy ${label}`)
      setTimeout(() => setCopiedAddress(''), 3000)
    }
  }

  const toggleAddressVisibility = (walletKey: string) => {
    setShowAddresses(prev => ({
      ...prev,
      [walletKey]: !prev[walletKey]
    }))
  }

  const toggleWalletDetails = (walletKey: string) => {
    setShowWalletDetails(prev => ({
      ...prev,
      [walletKey]: !prev[walletKey]
    }))
  }

  const copyAllWalletDetails = async (wallet: WalletBalance) => {
    const details = [
      `Wallet ID: ${wallet.walletId}`,
      wallet.accountId ? `Account ID: ${wallet.accountId}` : null,
      `Currency: ${wallet.currency}`,
      `Type: ${wallet.type}`,
      wallet.network ? `Network: ${wallet.network}` : null,
      `Balance: ${formatBalance(wallet.balance)}`,
      wallet.address ? `Address: ${wallet.address}` : null
    ].filter(Boolean).join('\n')
    
    await copyToClipboard(details, `${wallet.currency} wallet details`)
  }

  const fetchBankingDetails = async (accountId: string) => {
    if (!accountId) {
      console.error('No accountId provided for banking details')
      return
    }

    console.log('Fetching banking details for accountId:', accountId)
    setLoadingBankingDetails(true)
    try {
      const response = await fetch('/api/wallets/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accountId })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Banking details received:', data)
        setBankingDetails(data.bankingDetails)
      } else {
        const errorData = await response.text()
        console.error('Failed to fetch banking details:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error fetching banking details:', error)
    } finally {
      setLoadingBankingDetails(false)
    }
  }

  const formatBalance = (balance: { amount: string; currency: string }) => {
    const amount = parseFloat(balance.amount) || 0
    return `${amount.toFixed(2)} ${balance.currency}`
  }

  const getWalletIcon = (currency: string, type: 'crypto' | 'fiat') => {
    if (type === 'fiat') return <Building className="h-5 w-5" />
    if (currency === 'BTC') return <Bitcoin className="h-5 w-5" />
    return <Wallet className="h-5 w-5" />
  }

  const WalletCard = ({ wallet, isCompact = false }: { wallet: WalletBalance; isCompact?: boolean }) => {
    const walletKey = `${wallet.walletId}-${wallet.currency}`
    const showAddress = showAddresses[walletKey] || false
    const showDetails = showWalletDetails[walletKey] || false

    return (
      <div className={`border rounded-lg p-4 ${isCompact ? 'bg-gray-50' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getWalletIcon(wallet.currency, wallet.type)}
            <span className="font-medium">{wallet.currency}</span>
            <span className="text-sm text-gray-500 capitalize">({wallet.type})</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">Balance:</span>
            <div className="font-mono">
              {showBalance ? formatBalance(wallet.balance) : '••••••'}
            </div>
          </div>

          {/* Show Wallet Details Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleWalletDetails(walletKey)}
            className="w-full mt-2 mb-2"
          >
            {showDetails ? 'Hide Wallet Details' : 'Show Wallet Details'}
          </Button>

          {/* Wallet Details Section */}
          {showDetails && (
            <div className="bg-gray-50 p-3 rounded-md space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Wallet Details</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyAllWalletDetails(wallet)}
                  className="text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy All
                </Button>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Wallet ID:</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono">{wallet.walletId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wallet.walletId, 'Wallet ID')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {wallet.accountId && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Account ID:</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-mono">{wallet.accountId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(wallet.accountId!, 'Account ID')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Currency:</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono">{wallet.currency}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wallet.currency, 'Currency')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Type:</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono capitalize">{wallet.type}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wallet.type, 'Type')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {wallet.network && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Network:</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-mono">{wallet.network}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(wallet.network!, 'Network')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Balance:</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono">{formatBalance(wallet.balance)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(formatBalance(wallet.balance), 'Balance')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {copiedAddress && (
                <p className="text-xs text-green-600 mt-2">{copiedAddress}</p>
              )}
            </div>
          )}
          
          {wallet.type === 'crypto' && wallet.address && !showDetails && (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAddressVisibility(walletKey)}
                className="w-full mt-2 mb-2"
              >
                {showAddress ? 'Hide Wallet Address' : 'Show Wallet Address'}
              </Button>
              
              {showAddress && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Address:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wallet.address, wallet.currency)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="font-mono text-xs break-all bg-gray-100 p-2 rounded">
                    {wallet.address}
                  </div>
                  {copiedAddress === wallet.currency && (
                    <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
                  )}
                </div>
              )}
            </div>
          )}

          {wallet.type === 'fiat' && wallet.currency === 'EUR' && !showDetails && (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Banking details button clicked for wallet:', wallet)
                  if (wallet.accountId) {
                    fetchBankingDetails(wallet.accountId)
                  } else {
                    console.error('No accountId found on wallet:', wallet)
                  }
                }}
                disabled={loadingBankingDetails}
                className="w-full mt-2"
              >
                {loadingBankingDetails ? 'Loading...' : 'Show Banking Details'}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!primaryWallet) {
    return (
      <RefreshWalletsButton 
        onRefresh={() => {
          if (onRefresh) {
            onRefresh()
          }
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Primary Wallet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {userRole === 'SELLER' ? 'Primary Payment Account (EUR)' : 'Primary Wallet (BTC)'}
            </span>
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            {userRole === 'SELLER' 
              ? 'Receive payments in EUR with full banking details'
              : 'Your primary Bitcoin wallet for property purchases'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WalletCard wallet={primaryWallet} />
          
          {/* Banking Details for EUR wallet */}
          {bankingDetails && primaryWallet.currency === 'EUR' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium mb-3">Banking Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">IBAN:</span>
                  <div className="font-mono flex items-center justify-between">
                    <span>{bankingDetails.iban}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(bankingDetails.iban, 'IBAN')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">BIC:</span>
                  <div className="font-mono flex items-center justify-between">
                    <span>{bankingDetails.bic}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(bankingDetails.bic, 'BIC')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Bank Name:</span>
                  <div>{bankingDetails.bankName}</div>
                </div>
                <div>
                  <span className="text-gray-500">Account Holder:</span>
                  <div>{bankingDetails.accountHolderName}</div>
                </div>
                {bankingDetails.bankAddress && (
                  <div className="md:col-span-2">
                    <span className="text-gray-500">Bank Address:</span>
                    <div>{bankingDetails.bankAddress}</div>
                  </div>
                )}
              </div>
              {copiedAddress && (
                <p className="text-xs text-green-600 mt-2">{copiedAddress} copied to clipboard!</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>


      {/* See More Wallets Button */}
      {allWallets.length > 1 && (
        <Dialog open={showAllWallets} onOpenChange={setShowAllWallets}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              See More Wallets ({allWallets.length - 1} additional)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>All Your Wallets</DialogTitle>
              <DialogDescription>
                View all your crypto and fiat wallets
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {allWallets.map((wallet) => (
                <WalletCard key={`${wallet.walletId}-${wallet.currency}`} wallet={wallet} isCompact />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}