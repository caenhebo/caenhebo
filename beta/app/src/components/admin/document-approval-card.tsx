'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Eye,
  MessageSquare
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface Document {
  id: string
  filename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  documentType: string
  uploadedAt: string
  verified: boolean
  adminApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminComment?: string
  adminReviewedAt?: string
}

interface DocumentApprovalCardProps {
  document: Document
  documentLabel: string
  onStatusUpdate: () => void
}

export function DocumentApprovalCard({
  document,
  documentLabel,
  onStatusUpdate
}: DocumentApprovalCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [comment, setComment] = useState('')

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getApprovalBadge = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        )
    }
  }

  const handleApprovalSubmit = async () => {
    if (!approvalAction) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: approvalAction,
          comment: comment.trim() || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update document approval')
      }

      setShowApprovalDialog(false)
      setComment('')
      setApprovalAction(null)
      onStatusUpdate()
    } catch (error) {
      console.error('Error updating document approval:', error)
      alert('Failed to update document approval')
    } finally {
      setIsProcessing(false)
    }
  }

  const openApprovalDialog = (action: 'APPROVED' | 'REJECTED') => {
    setApprovalAction(action)
    setComment('')
    setShowApprovalDialog(true)
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
        <div className="flex items-center space-x-3 flex-1">
          <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{documentLabel}</p>
            <p className="text-sm text-gray-600">
              {document.filename} • {formatFileSize(document.fileSize)} • {new Date(document.uploadedAt).toLocaleDateString()}
            </p>
            {document.adminComment && (
              <p className="text-sm text-gray-500 mt-1 flex items-center">
                <MessageSquare className="h-3 w-3 mr-1" />
                {document.adminComment}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {getApprovalBadge(document.adminApprovalStatus)}

          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/api/documents/${document.id}/download`, '_blank')}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>

            {document.mimeType.startsWith('image/') || document.mimeType === 'application/pdf' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/api/uploads/${document.fileUrl.replace('/api/uploads/', '')}`, '_blank')}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
            ) : null}

            {document.adminApprovalStatus !== 'APPROVED' && (
              <Button
                size="sm"
                onClick={() => openApprovalDialog('APPROVED')}
                className="bg-green-600 hover:bg-green-700"
                title="Approve"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}

            {document.adminApprovalStatus !== 'REJECTED' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => openApprovalDialog('REJECTED')}
                title="Reject"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'APPROVED' ? 'Approve Document' : 'Reject Document'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'APPROVED'
                ? 'Confirm that this document meets all requirements.'
                : 'Provide a reason for rejecting this document.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document</Label>
              <p className="text-sm text-gray-600">{documentLabel}</p>
              <p className="text-xs text-gray-500">{document.filename}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">
                {approvalAction === 'REJECTED' ? 'Rejection Reason (Required)' : 'Comment (Optional)'}
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  approvalAction === 'REJECTED'
                    ? 'Please explain why this document is being rejected...'
                    : 'Add any comments about this document...'
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprovalSubmit}
              disabled={isProcessing || (approvalAction === 'REJECTED' && !comment.trim())}
              className={approvalAction === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={approvalAction === 'REJECTED' ? 'destructive' : 'default'}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : approvalAction === 'APPROVED' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {approvalAction === 'APPROVED' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}