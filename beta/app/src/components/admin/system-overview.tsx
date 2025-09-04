'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  FileText, 
  CreditCard, 
  Activity, 
  Home,
  Shield,
  Wallet,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Euro,
  RefreshCcw,
  Loader2,
  UserCheck,
  UserX,
  Bitcoin
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Stats {
  users: {
    total: number
    byRole: Record<string, number>
    buyers: number
    sellers: number
    admins: number
  }
  kyc: {
    total: number
    byStatus: Record<string, number>
    pending: number
    initiated: number
    passed: number
    rejected: number
  }
  properties: {
    total: number
    byStatus: Record<string, number>
    pending: number
    approved: number
    rejected: number
    totalValue: number
    averagePrice: number
  }
  transactions: {
    total: number
    byStatus: Record<string, number>
    active: number
    completed: number
    failed: number
    totalOfferVolume: number
    totalAgreedVolume: number
  }
  wallets: {
    total: number
    byCurrency: Record<string, number>
  }
  documentAccess: {
    total: number
    active: number
  }
  recentActivity: {
    newUsers: number
    newProperties: number
    newTransactions: number
  }
  timestamp: string
}

export default function SystemOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await fetch('/api/admin/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Failed to load statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading statistics...</span>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">{error || 'Failed to load statistics'}</p>
        <Button onClick={fetchStats} variant="outline">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="flex items-center">
                <UserCheck className="h-3 w-3 mr-1" />
                {stats.users.buyers} buyers
              </span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                <Home className="h-3 w-3 mr-1" />
                {stats.users.sellers} sellers
              </span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              +{stats.recentActivity.newUsers} this week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.properties.total}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="flex items-center">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                {stats.properties.approved}
              </span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                {stats.properties.pending}
              </span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              +{stats.recentActivity.newProperties} this week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactions.active}</div>
            <p className="text-xs text-muted-foreground">Active deals</p>
            <div className="text-xs mt-1">
              <span className="text-green-600">{stats.transactions.completed} completed</span>
              <span className="mx-1">•</span>
              <span className="text-red-600">{stats.transactions.failed} failed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.properties.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Property value listed</p>
            <p className="text-xs text-gray-600 mt-1">
              Avg: {formatCurrency(stats.properties.averagePrice)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KYC Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            KYC Verification Status
          </CardTitle>
          <CardDescription>User verification progress across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.kyc.pending}</div>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.kyc.initiated}</div>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.kyc.passed}</div>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.kyc.rejected}</div>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>KYC Completion Rate</span>
                <span className="font-medium">
                  {calculatePercentage(stats.kyc.passed, stats.users.total)}%
                </span>
              </div>
              <Progress 
                value={calculatePercentage(stats.kyc.passed, stats.users.total)} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>Last 7 days platform activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm">New Users</span>
                </div>
                <Badge variant="secondary">{stats.recentActivity.newUsers}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Home className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm">New Properties</span>
                </div>
                <Badge variant="secondary">{stats.recentActivity.newProperties}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-purple-500" />
                  <span className="text-sm">New Transactions</span>
                </div>
                <Badge variant="secondary">{stats.recentActivity.newTransactions}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2" />
              Wallet & Payment Stats
            </CardTitle>
            <CardDescription>Cryptocurrency wallet distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Wallets</span>
                <span className="font-medium">{stats.wallets.total}</span>
              </div>
              <div className="space-y-2">
                {Object.entries(stats.wallets.byCurrency).map(([currency, count]) => (
                  <div key={currency} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bitcoin className="h-4 w-4 mr-2 text-orange-500" />
                      <span className="text-sm">{currency}</span>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Document Access Granted</span>
                  <span className="font-medium">{stats.documentAccess.active}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh Stats
        </Button>
        <p className="text-xs text-gray-500 ml-4 mt-2">
          Last updated: {new Date(stats.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  )
}