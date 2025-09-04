import { NotificationType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface NotificationData {
  property?: {
    id: string
    code: string
    title: string
    address: string
    price: number
  }
  transaction?: {
    id: string
    offerPrice: number
    status: string
  }
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  documents?: {
    count: number
    types: string[]
  }
  other?: Record<string, any>
}

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: NotificationData
  transactionId?: string
  propertyId?: string
}

/**
 * Creates a new notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || null,
        transactionId: params.transactionId || null,
        propertyId: params.propertyId || null
      }
    })

    console.log(`Notification created: ${notification.type} for user ${params.userId}`)
    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    throw error
  }
}

/**
 * Creates notification when buyer makes a new offer
 */
export async function notifyNewOffer(
  sellerId: string, 
  buyerName: string, 
  propertyTitle: string, 
  offerPrice: number,
  transactionId: string,
  propertyId: string,
  propertyData?: any
) {
  return createNotification({
    userId: sellerId,
    type: NotificationType.NEW_OFFER,
    title: 'New Offer Received',
    message: `${buyerName} made an offer of €${offerPrice.toLocaleString()} on ${propertyTitle}`,
    data: {
      property: propertyData,
      transaction: {
        id: transactionId,
        offerPrice,
        status: 'OFFER'
      }
    },
    transactionId,
    propertyId
  })
}

/**
 * Creates notification when seller accepts an offer
 */
export async function notifyOfferAccepted(
  buyerId: string,
  sellerName: string,
  propertyTitle: string,
  agreedPrice: number,
  transactionId: string,
  propertyId: string
) {
  return createNotification({
    userId: buyerId,
    type: NotificationType.OFFER_ACCEPTED,
    title: 'Offer Accepted!',
    message: `${sellerName} accepted your offer of €${agreedPrice.toLocaleString()} for ${propertyTitle}`,
    data: {
      transaction: {
        id: transactionId,
        offerPrice: agreedPrice,
        status: 'AGREEMENT'
      }
    },
    transactionId,
    propertyId
  })
}

/**
 * Creates notification when seller rejects an offer
 */
export async function notifyOfferRejected(
  buyerId: string,
  sellerName: string,
  propertyTitle: string,
  rejectedPrice: number,
  transactionId: string,
  propertyId: string,
  reason?: string
) {
  return createNotification({
    userId: buyerId,
    type: NotificationType.OFFER_REJECTED,
    title: 'Offer Rejected',
    message: `${sellerName} rejected your offer of €${rejectedPrice.toLocaleString()} for ${propertyTitle}${reason ? '. Reason: ' + reason : ''}`,
    data: {
      transaction: {
        id: transactionId,
        offerPrice: rejectedPrice,
        status: 'CANCELLED'
      },
      other: {
        rejectionReason: reason
      }
    },
    transactionId,
    propertyId
  })
}

/**
 * Creates notification when counter offer is made
 */
export async function notifyCounterOffer(
  recipientId: string,
  senderName: string,
  propertyTitle: string,
  counterPrice: number,
  transactionId: string,
  propertyId: string,
  fromBuyer: boolean
) {
  const offerType = fromBuyer ? 'counter-offer' : 'counter-offer'
  return createNotification({
    userId: recipientId,
    type: NotificationType.COUNTER_OFFER,
    title: 'Counter Offer Received',
    message: `${senderName} made a ${offerType} of €${counterPrice.toLocaleString()} for ${propertyTitle}`,
    data: {
      transaction: {
        id: transactionId,
        offerPrice: counterPrice,
        status: 'NEGOTIATION'
      },
      other: {
        fromBuyer
      }
    },
    transactionId,
    propertyId
  })
}

/**
 * Creates notification when property is approved by admin
 */
export async function notifyPropertyApproved(
  sellerId: string,
  propertyTitle: string,
  propertyId: string,
  propertyCode: string,
  valuationPrice?: number
) {
  return createNotification({
    userId: sellerId,
    type: NotificationType.PROPERTY_APPROVED,
    title: 'Property Approved',
    message: `Your property "${propertyTitle}" has been approved and is now live! Property code: ${propertyCode}${valuationPrice ? `. Valuation: €${valuationPrice.toLocaleString()}` : ''}`,
    data: {
      property: {
        id: propertyId,
        code: propertyCode,
        title: propertyTitle,
        address: '',
        price: valuationPrice || 0
      }
    },
    propertyId
  })
}

/**
 * Creates notification when property is rejected by admin
 */
export async function notifyPropertyRejected(
  sellerId: string,
  propertyTitle: string,
  propertyId: string,
  reason?: string
) {
  return createNotification({
    userId: sellerId,
    type: NotificationType.PROPERTY_REJECTED,
    title: 'Property Compliance Issues',
    message: `Your property "${propertyTitle}" requires attention before approval${reason ? '. ' + reason : ''}`,
    data: {
      other: {
        rejectionReason: reason
      }
    },
    propertyId
  })
}

/**
 * Creates notification when documents are uploaded
 */
export async function notifyDocumentUploaded(
  recipientId: string,
  uploaderName: string,
  documentCount: number,
  documentTypes: string[],
  transactionId?: string,
  propertyId?: string,
  context?: string
) {
  const contextText = context || 'transaction'
  return createNotification({
    userId: recipientId,
    type: NotificationType.DOCUMENT_UPLOADED,
    title: 'New Documents Uploaded',
    message: `${uploaderName} uploaded ${documentCount} document${documentCount > 1 ? 's' : ''} for the ${contextText}`,
    data: {
      documents: {
        count: documentCount,
        types: documentTypes
      }
    },
    transactionId,
    propertyId
  })
}

/**
 * Creates notification when transaction status changes
 */
export async function notifyTransactionStatusChange(
  recipientId: string,
  propertyTitle: string,
  fromStatus: string,
  toStatus: string,
  transactionId: string,
  propertyId: string,
  notes?: string
) {
  const statusMessages = {
    OFFER: 'Offer submitted',
    NEGOTIATION: 'Under negotiation',
    AGREEMENT: 'Agreement reached',
    ESCROW: 'In escrow',
    CLOSING: 'Closing process',
    COMPLETED: 'Transaction completed',
    CANCELLED: 'Transaction cancelled'
  }

  const statusMessage = statusMessages[toStatus as keyof typeof statusMessages] || toStatus
  
  return createNotification({
    userId: recipientId,
    type: NotificationType.TRANSACTION_STATUS_CHANGE,
    title: 'Transaction Status Update',
    message: `Transaction for "${propertyTitle}" is now: ${statusMessage}${notes ? '. ' + notes : ''}`,
    data: {
      transaction: {
        id: transactionId,
        offerPrice: 0,
        status: toStatus
      },
      other: {
        fromStatus,
        notes
      }
    },
    transactionId,
    propertyId
  })
}

/**
 * Creates notification when KYC status changes
 */
export async function notifyKycStatusChange(
  userId: string,
  status: string,
  reason?: string
) {
  const statusMessages = {
    PASSED: { title: 'KYC Verification Approved', message: 'Your identity verification has been approved! You can now make offers and complete transactions.' },
    REJECTED: { title: 'KYC Verification Required', message: `Your identity verification needs attention${reason ? ': ' + reason : ''}` },
    EXPIRED: { title: 'KYC Verification Expired', message: 'Your identity verification has expired. Please complete verification again to continue.' }
  }

  const notification = statusMessages[status as keyof typeof statusMessages]
  if (!notification) return null

  return createNotification({
    userId,
    type: NotificationType.KYC_STATUS_CHANGE,
    title: notification.title,
    message: notification.message,
    data: {
      other: {
        kycStatus: status,
        reason
      }
    }
  })
}

/**
 * Creates notification when interview is scheduled
 */
export async function notifyInterviewScheduled(
  sellerId: string,
  propertyTitle: string,
  scheduledAt: Date,
  propertyId: string,
  duration: number = 60
) {
  return createNotification({
    userId: sellerId,
    type: NotificationType.INTERVIEW_SCHEDULED,
    title: 'Property Interview Scheduled',
    message: `Your property interview for "${propertyTitle}" is scheduled for ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString()}`,
    data: {
      other: {
        scheduledAt: scheduledAt.toISOString(),
        duration
      }
    },
    propertyId
  })
}

/**
 * Gets notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    })
  } catch (error) {
    console.error('Failed to get unread notification count:', error)
    return 0
  }
}

/**
 * Gets notifications for a user
 */
export async function getUserNotifications(
  userId: string, 
  limit: number = 10, 
  onlyUnread: boolean = false
) {
  try {
    return await prisma.notification.findMany({
      where: {
        userId,
        ...(onlyUnread ? { read: false } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  } catch (error) {
    console.error('Failed to get user notifications:', error)
    return []
  }
}

/**
 * Marks a notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    return await prisma.notification.update({
      where: {
        id: notificationId,
        userId // Ensure user can only mark their own notifications
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    throw error
  }
}

/**
 * Marks all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    return await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    throw error
  }
}