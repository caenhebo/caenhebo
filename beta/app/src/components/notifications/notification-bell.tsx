'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, X, Clock, FileText, Home, DollarSign, Shield, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown'
import { useRouter } from 'next/navigation'

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

interface NotificationBellProps {
  userId?: string
  className?: string
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'NEW_OFFER':
    case 'OFFER_ACCEPTED':
    case 'OFFER_REJECTED':
    case 'COUNTER_OFFER':
      return <DollarSign className="h-4 w-4 text-green-600" />
    case 'PROPERTY_APPROVED':
    case 'PROPERTY_REJECTED':
      return <Home className="h-4 w-4 text-blue-600" />
    case 'PROPERTY_INTEREST':
      return <Users className="h-4 w-4 text-indigo-600" />
    case 'DOCUMENT_UPLOADED':
      return <FileText className="h-4 w-4 text-purple-600" />
    case 'TRANSACTION_STATUS_CHANGE':
      return <Clock className="h-4 w-4 text-orange-600" />
    case 'KYC_STATUS_CHANGE':
      return <Shield className="h-4 w-4 text-red-600" />
    case 'INTERVIEW_SCHEDULED':
      return <Calendar className="h-4 w-4 text-indigo-600" />
    default:
      return <Bell className="h-4 w-4 text-gray-600" />
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

export default function NotificationBell({ userId, className = '' }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  const router = useRouter()

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  // Fetch notifications
  const fetchNotifications = async () => {
    if (loading) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Mark all as read
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
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    
    const link = getNotificationLink(notification)
    if (link !== '#') {
      router.push(link)
    }
    setIsOpen(false)
  }

  // Setup polling
  useEffect(() => {
    if (userId) {
      // Fetch initial data
      fetchUnreadCount()
      
      // Setup polling for unread count (every 30 seconds)
      intervalRef.current = setInterval(fetchUnreadCount, 30000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [userId])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications()
    }
  }, [isOpen, userId])

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  if (!userId) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${className}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-6 text-xs text-blue-600 hover:text-blue-800"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`cursor-pointer p-0 ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex w-full p-3">
                  <div className="flex-shrink-0 mr-3">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer justify-center text-blue-600 hover:text-blue-800"
              onClick={() => {
                router.push('/notifications')
                setIsOpen(false)
              }}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}