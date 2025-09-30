#!/usr/bin/env node

/**
 * Script to sync property visibility based on seller's KYC2 and mediation agreement status
 * Properties should only be visible if:
 * 1. Property is approved by compliance
 * 2. Seller has KYC2 PASSED
 * 3. Seller has signed mediation agreement
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function syncPropertyVisibility() {
  console.log('Starting property visibility sync...')

  try {
    // First, set all properties to not visible where seller doesn't meet requirements
    const hiddenResult = await prisma.property.updateMany({
      where: {
        OR: [
          {
            seller: {
              kyc2Status: { not: 'PASSED' }
            }
          },
          {
            seller: {
              mediationAgreementSigned: false
            }
          }
        ]
      },
      data: {
        isVisible: false
      }
    })

    console.log(`Set ${hiddenResult.count} properties to not visible (seller requirements not met)`)

    // Then, set properties to visible where seller meets all requirements and property is approved
    const visibleResult = await prisma.property.updateMany({
      where: {
        complianceStatus: 'APPROVED',
        finalApprovalStatus: 'APPROVED',
        seller: {
          kyc2Status: 'PASSED',
          mediationAgreementSigned: true
        }
      },
      data: {
        isVisible: true
      }
    })

    console.log(`Set ${visibleResult.count} properties to visible (all requirements met)`)

    // Get summary of current state
    const summary = await prisma.property.groupBy({
      by: ['isVisible', 'complianceStatus'],
      _count: true
    })

    console.log('\nCurrent property visibility summary:')
    summary.forEach(group => {
      console.log(`  - ${group.complianceStatus} properties, Visible: ${group.isVisible ? 'Yes' : 'No'}, Count: ${group._count}`)
    })

    // Get detailed info about visible approved properties
    const visibleProperties = await prisma.property.findMany({
      where: {
        complianceStatus: 'APPROVED',
        isVisible: true
      },
      include: {
        seller: {
          select: {
            email: true,
            kyc2Status: true,
            mediationAgreementSigned: true
          }
        }
      }
    })

    console.log('\nVisible approved properties:')
    visibleProperties.forEach(prop => {
      console.log(`  - ${prop.code}: ${prop.title}`)
      console.log(`    Seller: ${prop.seller.email}`)
      console.log(`    KYC2: ${prop.seller.kyc2Status}, Mediation: ${prop.seller.mediationAgreementSigned}`)
    })

    // Get info about hidden approved properties
    const hiddenProperties = await prisma.property.findMany({
      where: {
        complianceStatus: 'APPROVED',
        isVisible: false
      },
      include: {
        seller: {
          select: {
            email: true,
            kyc2Status: true,
            mediationAgreementSigned: true
          }
        }
      }
    })

    if (hiddenProperties.length > 0) {
      console.log('\nHidden approved properties (seller needs to complete requirements):')
      hiddenProperties.forEach(prop => {
        console.log(`  - ${prop.code}: ${prop.title}`)
        console.log(`    Seller: ${prop.seller.email}`)
        console.log(`    KYC2: ${prop.seller.kyc2Status}, Mediation: ${prop.seller.mediationAgreementSigned}`)
        const issues = []
        if (prop.seller.kyc2Status !== 'PASSED') issues.push('KYC2 not passed')
        if (!prop.seller.mediationAgreementSigned) issues.push('Mediation not signed')
        console.log(`    Issues: ${issues.join(', ')}`)
      })
    }

  } catch (error) {
    console.error('Error syncing property visibility:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the sync
syncPropertyVisibility()