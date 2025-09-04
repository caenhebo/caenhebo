import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const transactionId = params.id

    // Get transaction with all related data
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        property: true,
        buyer: {
          include: {
            profile: true
          }
        },
        seller: {
          include: {
            profile: true
          }
        },
        counterOffers: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if user is involved in the transaction
    if (transaction.buyerId !== session.user.id && transaction.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if transaction has reached agreement stage
    if (transaction.status !== 'AGREEMENT' && transaction.status !== 'ESCROW' && 
        transaction.status !== 'CLOSING' && transaction.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Agreement not yet reached' },
        { status: 400 }
      )
    }

    // Generate PDF HTML content
    const agreementHtml = generateAgreementHtml(transaction)

    return new NextResponse(agreementHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="agreement-${transaction.property.code}.html"`
      }
    })

  } catch (error) {
    console.error('Agreement PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate agreement' },
      { status: 500 }
    )
  }
}

function generateAgreementHtml(transaction: any) {
  const agreementDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Purchase Agreement - ${transaction.property.code}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    h1 {
      text-align: center;
      color: #2c3e50;
      margin-bottom: 40px;
      font-size: 28px;
    }
    
    h2 {
      color: #34495e;
      margin-top: 30px;
      margin-bottom: 15px;
      font-size: 20px;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 5px;
    }
    
    .header-info {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .agreement-number {
      font-size: 14px;
      color: #7f8c8d;
      margin-bottom: 5px;
    }
    
    .property-code {
      font-size: 18px;
      font-weight: bold;
      color: #2c3e50;
    }
    
    .party-section {
      margin-bottom: 30px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }
    
    .party-title {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 16px;
    }
    
    .party-detail {
      margin: 5px 0;
      font-size: 14px;
    }
    
    .property-details {
      background-color: #e8f4fd;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .terms-section {
      margin-bottom: 30px;
    }
    
    .term-item {
      margin-bottom: 15px;
      padding-left: 20px;
    }
    
    .price-section {
      background-color: #e8f8f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .price-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 16px;
    }
    
    .price-label {
      font-weight: bold;
    }
    
    .agreed-price {
      font-size: 20px;
      color: #27ae60;
      font-weight: bold;
    }
    
    .payment-method {
      margin-top: 15px;
      padding: 15px;
      background-color: #fff;
      border-radius: 5px;
    }
    
    .signature-section {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
    }
    
    .signature-box {
      width: 45%;
      text-align: center;
    }
    
    .signature-line {
      border-bottom: 2px solid #333;
      margin-bottom: 10px;
      height: 60px;
    }
    
    .signature-name {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .signature-date {
      font-size: 12px;
      color: #7f8c8d;
    }
    
    .footer {
      margin-top: 60px;
      text-align: center;
      font-size: 12px;
      color: #7f8c8d;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    }
    
    .print-button:hover {
      background-color: #2980b9;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Print Agreement</button>
  
  <h1>REAL ESTATE PURCHASE AGREEMENT</h1>
  
  <div class="header-info">
    <div class="agreement-number">Agreement ID: ${transaction.id}</div>
    <div class="property-code">Property Code: ${transaction.property.code}</div>
  </div>
  
  <p>This Purchase Agreement ("Agreement") is entered into on ${agreementDate}, by and between:</p>
  
  <div class="party-section">
    <div class="party-title">SELLER</div>
    <div class="party-detail">Name: ${transaction.seller.firstName} ${transaction.seller.lastName}</div>
    <div class="party-detail">Email: ${transaction.seller.email}</div>
    ${transaction.seller.phone ? `<div class="party-detail">Phone: ${transaction.seller.phone}</div>` : ''}
    ${transaction.seller.profile?.address ? `<div class="party-detail">Address: ${transaction.seller.profile.address}</div>` : ''}
  </div>
  
  <div class="party-section">
    <div class="party-title">BUYER</div>
    <div class="party-detail">Name: ${transaction.buyer.firstName} ${transaction.buyer.lastName}</div>
    <div class="party-detail">Email: ${transaction.buyer.email}</div>
    ${transaction.buyer.phone ? `<div class="party-detail">Phone: ${transaction.buyer.phone}</div>` : ''}
    ${transaction.buyer.profile?.address ? `<div class="party-detail">Address: ${transaction.buyer.profile.address}</div>` : ''}
  </div>
  
  <h2>1. PROPERTY DESCRIPTION</h2>
  
  <div class="property-details">
    <div class="party-detail"><strong>Title:</strong> ${transaction.property.title}</div>
    <div class="party-detail"><strong>Address:</strong> ${transaction.property.address}</div>
    <div class="party-detail"><strong>City:</strong> ${transaction.property.city}, ${transaction.property.postalCode}</div>
    <div class="party-detail"><strong>Country:</strong> ${transaction.property.country}</div>
    ${transaction.property.area ? `<div class="party-detail"><strong>Area:</strong> ${transaction.property.area} m²</div>` : ''}
    ${transaction.property.bedrooms ? `<div class="party-detail"><strong>Bedrooms:</strong> ${transaction.property.bedrooms}</div>` : ''}
    ${transaction.property.bathrooms ? `<div class="party-detail"><strong>Bathrooms:</strong> ${transaction.property.bathrooms}</div>` : ''}
  </div>
  
  <h2>2. PURCHASE PRICE AND PAYMENT</h2>
  
  <div class="price-section">
    <div class="price-row">
      <span class="price-label">Listed Price:</span>
      <span>${formatCurrency(parseFloat(transaction.property.price))}</span>
    </div>
    <div class="price-row">
      <span class="price-label">Initial Offer:</span>
      <span>${formatCurrency(parseFloat(transaction.offerPrice))}</span>
    </div>
    ${transaction.agreedPrice ? `
    <div class="price-row agreed-price">
      <span class="price-label">Agreed Purchase Price:</span>
      <span>${formatCurrency(parseFloat(transaction.agreedPrice))}</span>
    </div>
    ` : ''}
    
    <div class="payment-method">
      <strong>Payment Method:</strong> ${transaction.paymentMethod}
      ${transaction.paymentMethod === 'HYBRID' ? `
        <div style="margin-top: 10px;">
          <div>Cryptocurrency: ${transaction.cryptoPercentage}%</div>
          <div>Fiat Currency: ${transaction.fiatPercentage}%</div>
        </div>
      ` : ''}
    </div>
  </div>
  
  <h2>3. TERMS AND CONDITIONS</h2>
  
  <div class="terms-section">
    <div class="term-item">
      <strong>3.1 Acceptance Date:</strong> ${transaction.acceptanceDate ? new Date(transaction.acceptanceDate).toLocaleDateString() : 'To be determined'}
    </div>
    
    <div class="term-item">
      <strong>3.2 Escrow Period:</strong> The purchase price shall be held in escrow pending completion of all conditions precedent.
    </div>
    
    <div class="term-item">
      <strong>3.3 Property Condition:</strong> The property is sold in its present condition, subject to reasonable wear and tear.
    </div>
    
    <div class="term-item">
      <strong>3.4 Closing Date:</strong> The transaction shall close within 60 days of this agreement or as mutually agreed by both parties.
    </div>
    
    <div class="term-item">
      <strong>3.5 Compliance:</strong> This transaction is subject to all applicable Portuguese real estate laws and regulations.
    </div>
    
    ${transaction.offerTerms ? `
    <div class="term-item">
      <strong>3.6 Additional Terms:</strong>
      <div style="margin-top: 10px; padding-left: 20px;">
        ${transaction.offerTerms.replace(/\n/g, '<br>')}
      </div>
    </div>
    ` : ''}
  </div>
  
  <h2>4. REPRESENTATIONS AND WARRANTIES</h2>
  
  <div class="terms-section">
    <div class="term-item">
      <strong>4.1</strong> The Seller represents that they have full legal authority to sell the property.
    </div>
    <div class="term-item">
      <strong>4.2</strong> The Buyer represents that they have the financial capacity to complete this purchase.
    </div>
    <div class="term-item">
      <strong>4.3</strong> Both parties acknowledge completion of KYC/AML requirements through the Caenhebo platform.
    </div>
  </div>
  
  <h2>5. DISPUTE RESOLUTION</h2>
  
  <div class="terms-section">
    <p>Any disputes arising from this agreement shall be resolved through mediation, and if necessary, through the Portuguese courts.</p>
  </div>
  
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="signature-name">${transaction.seller.firstName} ${transaction.seller.lastName}</div>
      <div class="signature-date">Seller Signature & Date</div>
    </div>
    
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="signature-name">${transaction.buyer.firstName} ${transaction.buyer.lastName}</div>
      <div class="signature-date">Buyer Signature & Date</div>
    </div>
  </div>
  
  <div class="footer">
    <p>This agreement was generated through the Caenhebo Real Estate Platform</p>
    <p>Agreement Date: ${agreementDate}</p>
    <p>This is a preliminary agreement subject to final notarization as per Portuguese law</p>
  </div>
</body>
</html>
  `
}