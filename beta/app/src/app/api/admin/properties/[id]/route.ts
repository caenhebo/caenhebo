import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        },
        documents: {
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        interests: {
          include: {
            buyer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        transactions: {
          include: {
            buyer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Add computed fields for document and interview status
    const enhancedProperty = {
      ...property,
      documentStatus: getDocumentStatus(property.documents),
      // Don't override the interviewStatus from database
      interestCount: property.interests.length,
      transactionCount: property.transactions.length
    }

    return NextResponse.json({ property: enhancedProperty })
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDocumentStatus(documents: any[]) {
  if (documents.length === 0) return 'NOT_STARTED'
  
  const requiredTypes = [
    'COMPLIANCE_DECLARATION',
    'ENERGY_CERTIFICATE', 
    'USAGE_LICENSE',
    'LAND_REGISTRY',
    'TAX_REGISTER'
  ]
  
  const uploadedTypes = documents.map(d => d.documentType)
  const hasAllRequired = requiredTypes.every(type => uploadedTypes.includes(type))
  
  if (hasAllRequired) return 'COMPLETE'
  return 'INCOMPLETE'
}