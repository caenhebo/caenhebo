import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { nanoid } from 'nanoid'
import { notifyDocumentUploaded } from '@/lib/notifications'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

const TRANSACTION_DOCUMENT_CATEGORIES = [
  'CONTRACT',
  'PROOF_OF_PAYMENT',
  'LEGAL_DOCUMENT',
  'MEDIATION_AGREEMENT',
  'PURCHASE_AGREEMENT',
  'PAYMENT_PROOF',
  'NOTARIZED_DOCUMENT',
  'OTHER'
]

interface Params {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    const { id: transactionId } = await params
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Verify transaction exists and user has permission
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        property: true,
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check permissions: Buyer, seller, or admin can upload documents
    if (
      session.user.role !== 'ADMIN' && 
      transaction.buyerId !== session.user.id && 
      transaction.sellerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to upload documents for this transaction' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('type') as string
    const title = formData.get('title') as string || null
    const description = formData.get('description') as string || null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!documentType || !TRANSACTION_DOCUMENT_CATEGORIES.includes(documentType)) {
      return NextResponse.json(
        { error: `Invalid document type. Allowed types: ${TRANSACTION_DOCUMENT_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Create directory structure
    const transactionDir = path.join(UPLOAD_DIR, 'transactions', transactionId)
    await mkdir(transactionDir, { recursive: true })

    // Generate unique filename
    const fileExtension = path.extname(file.name)
    const uniqueFilename = `${nanoid()}_${Date.now()}${fileExtension}`
    const filePath = path.join(transactionDir, uniqueFilename)

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save document record to database
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        transactionId,
        type: documentType as any,
        filename: uniqueFilename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: `/uploads/transactions/${transactionId}/${uniqueFilename}`,
        title,
        description
      }
    })

    // Send notification to the other party about document upload
    try {
      const uploaderName = session.user.firstName && session.user.lastName 
        ? `${session.user.firstName} ${session.user.lastName}`
        : session.user.email

      // Determine who to notify (notify the other party)
      const recipientId = session.user.id === transaction.buyerId 
        ? transaction.sellerId 
        : transaction.buyerId

      await notifyDocumentUploaded(
        recipientId,
        uploaderName,
        1, // document count
        [documentType],
        transactionId,
        transaction.property.id,
        'transaction'
      )
    } catch (notificationError) {
      console.error('Failed to send document upload notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        type: document.type,
        filename: document.filename,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        url: document.url,
        title: document.title,
        description: document.description,
        createdAt: document.createdAt
      }
    })

  } catch (error) {
    console.error('Error uploading transaction document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get documents for a transaction
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    const { id: transactionId } = await params
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Verify transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check permissions: Only transaction parties and admins can view documents
    if (
      session.user.role !== 'ADMIN' && 
      transaction.buyerId !== session.user.id && 
      transaction.sellerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to view documents for this transaction' },
        { status: 403 }
      )
    }

    // Get documents
    const documents = await prisma.document.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        documentType: true,
        filename: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        fileUrl: true,
        title: true,
        description: true,
        createdAt: true,
        userId: true
      }
    })

    // Map documents to match frontend expectations
    const mappedDocuments = documents.map(doc => ({
      id: doc.id,
      type: doc.documentType,
      filename: doc.filename,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.fileSize,
      url: doc.fileUrl,
      title: doc.title,
      description: doc.description,
      createdAt: doc.createdAt,
      userId: doc.userId
    }))

    return NextResponse.json({
      success: true,
      documents: mappedDocuments
    })

  } catch (error) {
    console.error('Error fetching transaction documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}