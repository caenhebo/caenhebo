'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  RefreshCcw, 
  Wallet, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  User,
  CreditCard
} from 'lucide-react'

interface WalletMonitorData {
  stats: {
    totalUsers: number
    kycApprovedUsers: number
    usersWithCompleteWallets: number
    usersNeedingWallets: number
    totalWallets: number
  }
  users: Array<{
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: string
    kycStatus: string
    strigaUserId: string | null
    walletCount: number
    expectedWalletCount: number
    hasAllWallets: boolean
    missingCurrencies: string[]
    hasIban: boolean
    needsWallets: boolean
    wallets: Array<{
      currency: string
      balance: number
      strigaWalletId: string
    }>
    digitalIbans: Array<{
      iban: string
      bankName: string
      active: boolean
    }>
  }>
}

export function WalletMonitor() {
  const [data, setData] = useState<WalletMonitorData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshingUserId, setRefreshingUserId] = useState<string | null>(null)
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  const fetchWalletData = async () => {
    try {
      const response = await fetch('/api/admin/wallet-monitor')
      if (response.ok) {
        const data = await response.json()
        setData(data)
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to load wallet monitor data'
        })
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
      setMessage({
        type: 'error',
        text: 'Network error loading wallet data'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [])

  const refreshUserWallets = async (userId: string, userEmail: string) => {
    setRefreshingUserId(userId)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/wallet-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'refresh' })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage({
          type: 'success',
          text: `Successfully refreshed wallets for ${userEmail}`
        })
        // Refresh the data
        await fetchWalletData()
      } else {
        setMessage({
          type: 'error',
          text: result.error || `Failed to refresh wallets for ${userEmail}`
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error refreshing wallets for ${userEmail}`
      })
    } finally {
      setRefreshingUserId(null)
    }
  }

  const refreshAllWallets = async () => {
    setRefreshingAll(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/wallet-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'all', action: 'refresh-all' })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage({
          type: 'success',
          text: result.message
        })
        // Refresh the data
        await fetchWalletData()
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to refresh wallets'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error refreshing wallets'
      })
    } finally {
      setRefreshingAll(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCcw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2">Loading wallet monitor...</span>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p>Failed to load wallet monitor data</p>
        </CardContent>
      </Card>
    )
  }

  const usersNeedingAttention = data.users.filter(u => 
    u.kycStatus === 'PASSED' && u.needsWallets
  )

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">KYC Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.stats.kycApprovedUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Complete Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.stats.usersWithCompleteWallets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Need Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.stats.usersNeedingWallets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalWallets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons and Messages */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Wallet Management</CardTitle>
              <CardDescription>Monitor and manage user wallets</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchWalletData()}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              {usersNeedingAttention.length > 0 && (
                <Button
                  onClick={refreshAllWallets}
                  variant="default"
                  size="sm"
                  disabled={refreshingAll}
                >
                  <Wallet className={`h-4 w-4 mr-2 ${refreshingAll ? 'animate-spin' : ''}`} />
                  Create All Missing Wallets ({usersNeedingAttention.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={`mb-4 ${
              message.type === 'success' ? 'border-green-500' : 
              message.type === 'error' ? 'border-red-500' : 
              'border-blue-500'
            }`}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Users Needing Attention */}
      {usersNeedingAttention.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">
              <AlertCircle className="h-5 w-5 inline-block mr-2" />
              Users Needing Wallet Creation
            </CardTitle>
            <CardDescription>
              These KYC-approved users are missing wallets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Wallets</TableHead>
                  <TableHead>Missing</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersNeedingAttention.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-gray-500">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${
                        user.role === 'SELLER' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {user.walletCount}/{user.expectedWalletCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.missingCurrencies.length > 0 && (
                          <div>{user.missingCurrencies.join(', ')}</div>
                        )}
                        {!user.hasIban && user.role === 'SELLER' && (
                          <div className="text-red-600">Missing IBAN</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => refreshUserWallets(user.id, user.email)}
                        disabled={refreshingUserId === user.id}
                        size="sm"
                        variant="outline"
                      >
                        {refreshingUserId === user.id ? (
                          <>
                            <RefreshCcw className="h-3 w-3 mr-1 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Wallet className="h-3 w-3 mr-1" />
                            Create Wallets
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Complete wallet status for all users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Wallets</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        {user.firstName} {user.lastName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${
                      user.role === 'SELLER' ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${
                      user.kycStatus === 'PASSED' ? 'text-green-600' : 
                      user.kycStatus === 'REJECTED' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {user.kycStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {user.walletCount}/{user.expectedWalletCount}
                      </span>
                      {user.role === 'SELLER' && (
                        <span className="text-xs text-gray-500">
                          {user.hasIban ? '+ IBAN' : ''}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.hasAllWallets && user.hasIban ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : user.kycStatus !== 'PASSED' ? (
                      <span className="text-sm text-gray-500">KYC Required</span>
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    {user.kycStatus === 'PASSED' && user.needsWallets && (
                      <Button
                        onClick={() => refreshUserWallets(user.id, user.email)}
                        disabled={refreshingUserId === user.id}
                        size="sm"
                        variant="outline"
                      >
                        {refreshingUserId === user.id ? (
                          <>
                            <RefreshCcw className="h-3 w-3 mr-1 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Wallet className="h-3 w-3 mr-1" />
                            Fix
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}