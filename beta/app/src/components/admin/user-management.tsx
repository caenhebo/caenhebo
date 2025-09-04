'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Search,
  Shield,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  RefreshCw
} from 'lucide-react'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  role: 'ADMIN' | 'BUYER' | 'SELLER'
  kycStatus?: string
  emailVerified: boolean
  phoneVerified: boolean
  strigaUserId?: string
  createdAt: string
  updatedAt: string
  _count?: {
    sellerProperties?: number
    buyerTransactions?: number
    sellerTransactions?: number
    wallets?: number
  }
}

export default function UserManagement() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [stats, setStats] = useState({
    totalUsers: 0,
    admins: 0,
    sellers: 0,
    buyers: 0,
    kycApproved: 0,
    kycPending: 0
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, selectedRole, users])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users')
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users || [])
      calculateStats(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (userList: User[]) => {
    const stats = {
      totalUsers: userList.length,
      admins: userList.filter(u => u.role === 'ADMIN').length,
      sellers: userList.filter(u => u.role === 'SELLER').length,
      buyers: userList.filter(u => u.role === 'BUYER').length,
      kycApproved: userList.filter(u => u.kycStatus === 'PASSED').length,
      kycPending: userList.filter(u => u.kycStatus === 'INITIATED' || u.kycStatus === 'PENDING').length
    }
    setStats(stats)
  }

  const filterUsers = () => {
    let filtered = users

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(u => u.role === selectedRole)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(u => 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phoneNumber?.includes(searchQuery)
      )
    }

    setFilteredUsers(filtered)
  }

  const getKycBadge = (status?: string) => {
    switch (status) {
      case 'PASSED':
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            KYC Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            KYC Rejected
          </Badge>
        )
      case 'INITIATED':
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            KYC Pending
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
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
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )
      case 'SELLER':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Building className="h-3 w-3 mr-1" />
            Seller
          </Badge>
        )
      case 'BUYER':
        return (
          <Badge className="bg-indigo-100 text-indigo-800">
            <User className="h-3 w-3 mr-1" />
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
      year: 'numeric'
    })
  }

  const syncStrigaUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/sync-striga`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Refresh users list
        fetchUsers()
      }
    } catch (error) {
      console.error('Error syncing Striga user:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.sellers}</div>
            <p className="text-xs text-muted-foreground">Sellers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.buyers}</div>
            <p className="text-xs text-muted-foreground">Buyers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.kycApproved}</div>
            <p className="text-xs text-muted-foreground">KYC Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.kycPending}</div>
            <p className="text-xs text-muted-foreground">KYC Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Manage user accounts and KYC status
              </CardDescription>
            </div>
            <Button onClick={fetchUsers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by email, name, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admins</option>
              <option value="SELLER">Sellers</option>
              <option value="BUYER">Buyers</option>
            </select>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading users...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {user.firstName || user.lastName 
                                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                : 'No Name'
                              }
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            {user.phoneNumber && (
                              <div className="text-sm text-gray-600 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {user.phoneNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {getKycBadge(user.kycStatus)}
                            {user.strigaUserId && (
                              <div className="text-xs text-gray-500">
                                Striga ID: {user.strigaUserId.slice(0, 8)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              {user.emailVerified ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <XCircle className="h-3 w-3 text-gray-400" />
                              )}
                              Email
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              {user.phoneVerified ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <XCircle className="h-3 w-3 text-gray-400" />
                              )}
                              Phone
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {user.role === 'SELLER' && user._count?.sellerProperties !== undefined && (
                              <div>{user._count.sellerProperties} properties</div>
                            )}
                            {((user._count?.buyerTransactions || 0) + (user._count?.sellerTransactions || 0)) > 0 && (
                              <div>{(user._count?.buyerTransactions || 0) + (user._count?.sellerTransactions || 0)} transactions</div>
                            )}
                            {user._count?.wallets !== undefined && user._count.wallets > 0 && (
                              <div>{user._count.wallets} wallets</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {formatDate(user.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {user.strigaUserId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => syncStrigaUser(user.id)}
                                title="Sync with Striga"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}