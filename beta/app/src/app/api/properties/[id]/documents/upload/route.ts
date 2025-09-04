import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { nanoid } from 'nanoid'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

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

const PROPERTY_DOCUMENT_CATEGORIES = [
  'COMPLIANCE_DECLARATION',
  'ENERGY_CERTIFICATE',
  'USAGE_LICENSE',
  'LAND_REGISTRY',
  'TAX_REGISTER',
  'TITLE_DEED',
  'CERTIFICATE', 
  'PHOTO',
  'FLOOR_PLAN',
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

    const { id: propertyId } = await params
    
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Verify property exists and user has permission
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check permissions: Owner or admin can upload documents
    if (session.user.role !== 'ADMIN' && property.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to upload documents for this property' },
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

    if (!documentType || !PROPERTY_DOCUMENT_CATEGORIES.includes(documentType)) {
      return NextResponse.json(
        { error: `Invalid document type. Allowed types: ${PROPERTY_DOCUMENT_CATEGORIES.join(', ')}` },
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
    const propertyDir = path.join(UPLOAD_DIR, 'properties', propertyId)
    await mkdir(propertyDir, { recursive: true })

    // Generate unique filename
    const fileExtension = path.extname(file.name)
    const uniqueFilename = `${nanoid()}_${Date.now()}${fileExtension}`
    const filePath = path.join(propertyDir, uniqueFilename)

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save document record to database
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        propertyId,
        documentType: documentType as any,
        filename: uniqueFilename,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        fileUrl: `/uploads/properties/${propertyId}/${uniqueFilename}`,
        title,
        description
      }
    })

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        documentType: document.documentType,
        filename: document.filename,
        originalName: document.originalName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        fileUrl: document.fileUrl,
        title: document.title,
        description: document.description,
        uploadedAt: document.uploadedAt
      }
    })

  } catch (error) {
    console.error('Error uploading property document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get documents for a property
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    const { id: propertyId } = await params
    
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check visibility permissions
    // - Property owner can see all documents
    // - Buyers with interest can see public documents  
    // - Admins can see all documents
    let canViewAll = false
    
    if (session.user.role === 'ADMIN' || property.sellerId === session.user.id) {
      canViewAll = true
    } else if (session.user.role === 'BUYER') {
      // Check if buyer has shown interest in this property
      const hasInterest = await prisma.propertyInterest.findUnique({
        where: {
          propertyId_buyerId: {
            propertyId,
            buyerId: session.user.id
          }
        }
      })
      canViewAll = !!hasInterest
    }

    if (!canViewAll) {
      return NextResponse.json(
        { error: 'You do not have permission to view documents for this property' },
        { status: 403 }
      )
    }

    // Get documents
    const documents = await prisma.document.findMany({
      where: { propertyId },
      orderBy: { uploadedAt: 'desc' },
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
        uploadedAt: true,
        verified: true,
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
      createdAt: doc.uploadedAt,
      verified: doc.verified,
      userId: doc.userId
    }))

    return NextResponse.json({
      success: true,
      documents: mappedDocuments
    })

  } catch (error) {
    console.error('Error fetching property documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}