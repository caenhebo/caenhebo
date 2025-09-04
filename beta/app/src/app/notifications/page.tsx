'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bell, Check, X, Clock, FileText, Home, DollarSign, Shield, Calendar, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: any
  metadata?: any
  read: boolean
  readAt?: string
  transactionId?: string
  propertyId?: string
  relatedEntityType?: string
  relatedEntityId?: string
  createdAt: string
  updatedAt: string
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'NEW_OFFER':
    case 'OFFER_ACCEPTED':
    case 'OFFER_REJECTED':
    case 'COUNTER_OFFER':
      return <DollarSign className="h-5 w-5 text-green-600" />
    case 'PROPERTY_APPROVED':
    case 'PROPERTY_REJECTED':
      return <Home className="h-5 w-5 text-blue-600" />
    case 'PROPERTY_INTEREST':
      return <Users className="h-5 w-5 text-indigo-600" />
    case 'DOCUMENT_UPLOADED':
      return <FileText className="h-5 w-5 text-purple-600" />
    case 'TRANSACTION_STATUS_CHANGE':
      return <Clock className="h-5 w-5 text-orange-600" />
    case 'KYC_STATUS_CHANGE':
      return <Shield className="h-5 w-5 text-red-600" />
    case 'INTERVIEW_SCHEDULED':
      return <Calendar className="h-5 w-5 text-indigo-600" />
    default:
      return <Bell className="h-5 w-5 text-gray-600" />
  }
}

const getNotificationLink = (notification: Notification): string => {
  // Handle transaction-related notifications
  if (notification.transactionId) {
    return `/transactions/${notification.transactionId}`
  }
  
  // Handle property interest notifications for sellers
  if (notification.type === 'PROPERTY_INTEREST' && notification.relatedEntityType === 'PROPERTY') {
    return `/seller/properties/${notification.relatedEntityId || notification.propertyId}`
  }
  
  // Handle property-related notifications
  if (notification.propertyId) {
    return `/property/${notification.data?.property?.code || notification.metadata?.propertyCode || notification.propertyId}`
  }
  
  // Handle other entity types
  if (notification.relatedEntityType && notification.relatedEntityId) {
    switch (notification.relatedEntityType) {
      case 'PROPERTY':
        return `/seller/properties/${notification.relatedEntityId}`
      case 'TRANSACTION':
        return `/transactions/${notification.relatedEntityId}`
      default:
        return '#'
    }
  }
  
  return '#'
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user) {
      fetchNotifications()
    }
  }, [session, status, router])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/notifications?limit=50&unread=${filter === 'unread'}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      } else {
        console.error('Failed to fetch notifications')
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        ))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ 
          ...n, 
          read: true, 
          readAt: new Date().toISOString() 
        })))
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    
    const link = getNotificationLink(notification)
    if (link !== '#') {
      router.push(link)
    }
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="h-8 w-8" />
                Notifications
              </h1>
              <p className="text-gray-600 mt-2">
                {unreadCount > 0 
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-white rounded-lg border p-1">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
              </div>
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline" size="sm">
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">Loading notifications...</div>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">
                {filter === 'unread' 
                  ? 'No unread notifications' 
                  : 'No notifications yet'
                }
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-gray-700 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                            <Badge variant={notification.read ? 'secondary' : 'default'}>
                              {notification.read ? 'Read' : 'Unread'}
                            </Badge>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0 ml-4">
                            <div className="w-3 h-3 bg-blue-600 rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}