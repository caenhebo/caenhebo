import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a seller and KYC is approved
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'SELLER') {
      return NextResponse.json(
        { error: 'Only sellers can list properties' },
        { status: 403 }
      )
    }

    if (user.kycStatus !== 'PASSED') {
      return NextResponse.json(
        { error: 'KYC verification required to list properties' },
        { status: 400 }
      )
    }

    // Parse FormData
    const formData = await request.formData()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const propertyType = formData.get('propertyType') as string
    const address = formData.get('address') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string
    const postalCode = formData.get('postalCode') as string
    const country = formData.get('country') as string || 'Portugal'
    const price = formData.get('price') as string
    const area = formData.get('area') as string
    const bedrooms = formData.get('bedrooms') as string
    const bathrooms = formData.get('bathrooms') as string

    // Get files
    const photoFiles = formData.getAll('photos') as File[]
    const diagramFiles = formData.getAll('diagrams') as File[]

    // Validate required fields
    if (!title || !address || !city || !postalCode || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: title, address, city, postalCode, price' },
        { status: 400 }
      )
    }

    // Validate price is positive
    if (parseFloat(price) <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate photo limit
    if (photoFiles.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 photos allowed' },
        { status: 400 }
      )
    }

    // Generate unique property code
    const year = new Date().getFullYear()
    const propertyCount = await prisma.property.count()
    const propertyCode = `CAE-${year}-${(propertyCount + 1).toString().padStart(4, '0')}`

    // Create property first to get ID for folder
    const property = await prisma.property.create({
      data: {
        code: propertyCode,
        title,
        description: description || null,
        propertyType: propertyType || null,
        address,
        city,
        state: state || null,
        postalCode,
        country,
        price: parseFloat(price),
        area: area ? parseFloat(area) : null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        sellerId: session.user.id,
        complianceStatus: 'PENDING',
        photos: [],
        diagrams: []
      }
    })

    // Upload directory
    const uploadDir = join(process.cwd(), 'uploads', 'properties', property.id)
    await mkdir(uploadDir, { recursive: true })

    // Upload photos
    const photoUrls: string[] = []
    for (const file of photoFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = `${nanoid()}_${Date.now()}.${file.name.split('.').pop()}`
        const filepath = join(uploadDir, filename)
        await writeFile(filepath, buffer)
        photoUrls.push(`/api/uploads/properties/${property.id}/${filename}`)
      }
    }

    // Upload diagrams
    const diagramUrls: string[] = []
    for (const file of diagramFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = `diagram_${nanoid()}_${Date.now()}.${file.name.split('.').pop()}`
        const filepath = join(uploadDir, filename)
        await writeFile(filepath, buffer)
        diagramUrls.push(`/api/uploads/properties/${property.id}/${filename}`)
      }
    }

    // Update property with photo and diagram URLs
    const updatedProperty = await prisma.property.update({
      where: { id: property.id },
      data: {
        photos: photoUrls,
        diagrams: diagramUrls
      }
    })

    return NextResponse.json({
      property: {
        id: updatedProperty.id,
        code: updatedProperty.code,
        title: updatedProperty.title,
        description: updatedProperty.description,
        propertyType: updatedProperty.propertyType,
        address: updatedProperty.address,
        city: updatedProperty.city,
        state: updatedProperty.state,
        postalCode: updatedProperty.postalCode,
        country: updatedProperty.country,
        price: updatedProperty.price.toString(),
        area: updatedProperty.area,
        bedrooms: updatedProperty.bedrooms,
        bathrooms: updatedProperty.bathrooms,
        photos: updatedProperty.photos,
        diagrams: updatedProperty.diagrams,
        complianceStatus: updatedProperty.complianceStatus,
        createdAt: updatedProperty.createdAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Property creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    )
  }
}