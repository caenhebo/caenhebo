'use client'

import { useState } from 'react'
import DocumentUpload from './document-upload'
import DocumentList from './document-list'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, FileText } from 'lucide-react'

interface DocumentManagerProps {
  entityId: string
  entityType: 'property' | 'transaction'
  currentUserId: string
  userRole: string
  canUpload?: boolean
  className?: string
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

export default function DocumentManager({
  entityId,
  entityType,
  currentUserId,
  userRole,
  canUpload = false,
  className
}: DocumentManagerProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = () => {
    // Trigger refresh of document list
    setRefreshKey(prev => prev + 1)
  }

  const handleDocumentDeleted = () => {
    // Trigger refresh of document list
    setRefreshKey(prev => prev + 1)
  }

  if (!canUpload) {
    // Show only document list if user can't upload
    return (
      <DocumentList
        key={refreshKey}
        entityId={entityId}
        entityType={entityType}
        currentUserId={currentUserId}
        userRole={userRole}
        onDocumentDeleted={handleDocumentDeleted}
        className={className}
      />
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center">
              <Upload className="mr-2 h-4 w-4" />
              Upload New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <DocumentList
              key={refreshKey}
              entityId={entityId}
              entityType={entityType}
              currentUserId={currentUserId}
              userRole={userRole}
              onDocumentDeleted={handleDocumentDeleted}
            />
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <DocumentUpload
              entityId={entityId}
              entityType={entityType}
              allowedTypes={ALLOWED_MIME_TYPES}
              onUploadComplete={handleUploadComplete}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}