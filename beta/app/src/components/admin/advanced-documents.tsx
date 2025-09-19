'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { FileText, Download, RefreshCw, Home, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface TransactionDocument {
  id: string
  transactionId: string
  type: string
  filename: string
  originalName: string
  url: string
  uploadedAt: string
  uploadedBy: string
  property: {
    code: string
    title: string
    address: string
    city: string
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
  transactionStatus: string
}

export default function AdvancedDocuments() {
  const [documents, setDocuments] = useState<TransactionDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/transactions/documents')
      if (!response.ok) {
        throw new Error('Failed to fetch document data')
      }

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching document data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const getDocumentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'REPRESENTATION_DOCUMENT': 'bg-purple-100 text-purple-800',
      'MEDIATION_AGREEMENT': 'bg-blue-100 text-blue-800',
      'PURCHASE_AGREEMENT': 'bg-green-100 text-green-800',
      'PROOF_OF_PAYMENT': 'bg-yellow-100 text-yellow-800',
      'CONTRACT': 'bg-indigo-100 text-indigo-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500">Error: {error}</div>
          <Button onClick={fetchDocuments} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction Documents Overview</span>
            <Button onClick={fetchDocuments} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            All documents uploaded for active transactions with property and party details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No transaction documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm">{doc.originalName}</span>
                          </div>
                          <Badge className={`mt-1 text-xs ${getDocumentTypeBadge(doc.type)}`}>
                            {doc.type.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Home className="h-3 w-3 text-gray-400" />
                            <span className="font-medium">{doc.property.code}</span>
                          </div>
                          <div className="text-xs text-gray-500">{doc.property.title}</div>
                          <div className="text-xs text-gray-400">
                            {doc.property.address}, {doc.property.city}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-blue-400" />
                            <span>{doc.buyer.firstName} {doc.buyer.lastName}</span>
                          </div>
                          <div className="text-xs text-gray-500">{doc.buyer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-green-400" />
                            <span>{doc.seller.firstName} {doc.seller.lastName}</span>
                          </div>
                          <div className="text-xs text-gray-500">{doc.seller.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>{format(new Date(doc.uploadedAt), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="text-xs text-gray-500">by {doc.uploadedBy}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {doc.transactionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" />
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
        </CardContent>
      </Card>
    </div>
  )
}