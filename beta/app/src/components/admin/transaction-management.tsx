'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { Eye, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface PropertyInterest {
  id: string
  propertyId: string
  buyerId: string
  interestedAt: string
  message: string | null
  property: {
    code: string
    title: string
    city: string
    price: string
  }
  buyer: {
    firstName: string
    lastName: string
    email: string
  }
}

interface Transaction {
  id: string
  propertyId: string
  buyerId: string
  sellerId: string
  status: string
  offerPrice: string
  agreedPrice: string | null
  paymentMethod: string
  createdAt: string
  property: {
    code: string
    title: string
    city: string
    price: string
  }
  buyer: {
    firstName: string
    lastName: string
    email: string
  }
  seller: {
    firstName: string
    lastName: string
    email: string
  }
}

export default function TransactionManagement() {
  const [interests, setInterests] = useState<PropertyInterest[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/transactions')
      if (!response.ok) {
        throw new Error('Failed to fetch transaction data')
      }

      const data = await response.json()
      setInterests(data.interests || [])
      setTransactions(data.transactions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching transaction data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      OFFER: 'bg-blue-100 text-blue-800',
      NEGOTIATION: 'bg-yellow-100 text-yellow-800',
      AGREEMENT: 'bg-purple-100 text-purple-800',
      ESCROW: 'bg-orange-100 text-orange-800',
      CLOSING: 'bg-indigo-100 text-indigo-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    )
  }

  const getPaymentMethodBadge = (method: string) => {
    const methodColors: Record<string, string> = {
      CRYPTO: 'bg-purple-100 text-purple-800',
      FIAT: 'bg-green-100 text-green-800',
      HYBRID: 'bg-blue-100 text-blue-800',
    }

    return (
      <Badge className={methodColors[method] || 'bg-gray-100 text-gray-800'}>
        {method}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading transaction data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Transaction Management</CardTitle>
            <CardDescription>Monitor property interests and active transactions</CardDescription>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="interests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="interests">
              Property Interests ({interests.length})
            </TabsTrigger>
            <TabsTrigger value="offers">
              Offers & Transactions ({transactions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interests" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No property interests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    interests.map((interest) => (
                      <TableRow key={interest.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{interest.property.title}</p>
                            <p className="text-sm text-gray-500">
                              {interest.property.code} • {interest.property.city}
                            </p>
                            <p className="text-sm font-medium text-gray-700">
                              {formatCurrency(parseFloat(interest.property.price))}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {interest.buyer.firstName} {interest.buyer.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{interest.buyer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(interest.interestedAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {interest.message ? (
                            <p className="text-sm text-gray-600 max-w-xs truncate">
                              {interest.message}
                            </p>
                          ) : (
                            <span className="text-gray-400 text-sm">No message</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/admin/properties/${interest.propertyId}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="offers" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Offer Price</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.property.title}</p>
                            <p className="text-sm text-gray-500">
                              {transaction.property.code} • {transaction.property.city}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {transaction.buyer.firstName} {transaction.buyer.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{transaction.buyer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {transaction.seller.firstName} {transaction.seller.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{transaction.seller.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {formatCurrency(parseFloat(transaction.offerPrice))}
                            </p>
                            {transaction.agreedPrice && (
                              <p className="text-sm text-green-600">
                                Agreed: {formatCurrency(parseFloat(transaction.agreedPrice))}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(transaction.paymentMethod)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/transactions/${transaction.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}