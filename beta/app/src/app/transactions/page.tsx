'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Euro,
  Calendar,
  MapPin,
  User,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react'

interface Transaction {
  id: string
  propertyId: string
  status: string
  offerPrice: string
  agreedPrice?: string
  offerMessage?: string
  offerTerms?: string
  proposalDate?: string
  acceptanceDate?: string
  escrowDate?: string
  completionDate?: string
  createdAt: string
  updatedAt: string
  userRole: 'buyer' | 'seller'
  counterOffersCount: number
  property: {
    id: string
    code: string
    title: string
    address: string
    city: string
    price: string
    complianceStatus: string
  }
  buyer: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  seller: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  latestCounterOffer?: {
    id: string
    price: string
    message?: string
    fromBuyer: boolean
    createdAt: string
  }
  lastStatusChange?: {
    fromStatus?: string
    toStatus: string
    changedBy?: string
    notes?: string
    createdAt: string
  }
}

export default function TransactionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    fetchTransactions()
  }, [session, status])

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch('/api/transactions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      setTransactions(data.transactions)
      
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(price))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; icon: React.ReactNode } } = {
      'OFFER': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3 h-3" /> },
      'NEGOTIATION': { color: 'bg-orange-100 text-orange-800', icon: <MessageSquare className="w-3 h-3" /> },
      'AGREEMENT': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      'ESCROW': { color: 'bg-purple-100 text-purple-800', icon: <TrendingUp className="w-3 h-3" /> },
      'CLOSING': { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-3 h-3" /> },
      'COMPLETED': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      'CANCELLED': { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> }
    }
    
    const config = statusConfig[status] || statusConfig['OFFER']
    
    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        {config.icon}
        <span className="ml-1">{status}</span>
      </Badge>
    )
  }

  const filterTransactions = (transactions: Transaction[], filter: string) => {
    switch (filter) {
      case 'buying':
        return transactions.filter(t => t.userRole === 'buyer')
      case 'selling':
        return transactions.filter(t => t.userRole === 'seller')
      case 'active':
        return transactions.filter(t => !['COMPLETED', 'CANCELLED'].includes(t.status))
      case 'completed':
        return transactions.filter(t => ['COMPLETED', 'CANCELLED'].includes(t.status))
      default:
        return transactions
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading transactions...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Transactions</h1>
              <p className="text-gray-600 mt-1">Track all your property offers and deals</p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({transactions.length})</TabsTrigger>
            <TabsTrigger value="buying">
              Buying ({filterTransactions(transactions, 'buying').length})
            </TabsTrigger>
            <TabsTrigger value="selling">
              Selling ({filterTransactions(transactions, 'selling').length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({filterTransactions(transactions, 'active').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({filterTransactions(transactions, 'completed').length})
            </TabsTrigger>
          </TabsList>

          {['all', 'buying', 'selling', 'active', 'completed'].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="mt-6">
              <div className="grid gap-6">
                {filterTransactions(transactions, tabValue).length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                      <p className="text-gray-500">
                        {tabValue === 'all' && "You haven't made any offers or received any transactions yet."}
                        {tabValue === 'buying' && "You haven't made any offers on properties yet."}
                        {tabValue === 'selling' && "You haven't received any offers on your properties yet."}
                        {tabValue === 'active' && "You don't have any active transactions."}
                        {tabValue === 'completed' && "You don't have any completed transactions."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filterTransactions(transactions, tabValue).map((transaction) => (
                    <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {transaction.property.title}
                            </CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <span className="font-mono text-blue-600 mr-3">
                                {transaction.property.code}
                              </span>
                              <MapPin className="w-4 h-4 mr-1" />
                              {transaction.property.address}, {transaction.property.city}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getStatusBadge(transaction.status)}
                            <Badge variant="outline">
                              {transaction.userRole === 'buyer' ? 'Buying' : 'Selling'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Euro className="w-4 h-4 mr-1" />
                              <span>Offer Price</span>
                            </div>
                            <div className="font-semibold text-lg">
                              {formatPrice(transaction.offerPrice)}
                            </div>
                          </div>
                          
                          {transaction.agreedPrice && (
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <span>Agreed Price</span>
                              </div>
                              <div className="font-semibold text-lg text-green-600">
                                {formatPrice(transaction.agreedPrice)}
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>Created</span>
                            </div>
                            <div className="font-medium">
                              {formatDate(transaction.createdAt)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              <span>
                                {transaction.userRole === 'buyer' 
                                  ? `Seller: ${transaction.seller.firstName} ${transaction.seller.lastName}`
                                  : `Buyer: ${transaction.buyer.firstName} ${transaction.buyer.lastName}`
                                }
                              </span>
                            </div>
                            
                            {transaction.counterOffersCount > 0 && (
                              <div className="flex items-center">
                                <MessageSquare className="w-4 h-4 mr-1" />
                                <span>{transaction.counterOffersCount} counter offers</span>
                              </div>
                            )}
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/transactions/${transaction.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>

                        {transaction.offerMessage && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Message:</div>
                            <div className="text-sm">{transaction.offerMessage}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}