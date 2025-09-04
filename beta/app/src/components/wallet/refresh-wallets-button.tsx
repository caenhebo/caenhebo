'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { RefreshCcw } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RefreshWalletsButtonProps {
  onRefresh: () => void
  onSyncComplete?: () => void
}

export function RefreshWalletsButton({ onRefresh, onSyncComplete }: RefreshWalletsButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setMessage(null)
    
    try {
      // First try to refresh from existing data
      await onRefresh()
      
      // Wait a bit to see if wallets appear
      setTimeout(async () => {
        // If still no wallets visible after refresh, try sync
        const checkResponse = await fetch('/api/wallets')
        const checkData = await checkResponse.json()
        
        if (!checkData.wallets || checkData.wallets.length === 0) {
          await handleSync()
        } else {
          setMessage({
            type: 'success',
            text: 'Wallets refreshed successfully!'
          })
        }
      }, 1000)
      
    } catch (error) {
      console.error('Refresh error:', error)
      setMessage({
        type: 'error',
        text: 'Failed to refresh wallets. Please try again.'
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/wallets/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to sync wallets')
      }

      const data = await response.json()
      
      if (data.results.created.length > 0) {
        setMessage({
          type: 'success',
          text: `Created ${data.results.created.length} wallets. Refreshing...`
        })
        
        // Refresh after a short delay
        setTimeout(() => {
          if (onSyncComplete) {
            onSyncComplete()
          } else {
            window.location.reload()
          }
        }, 2000)
      } else {
        setMessage({
          type: 'info',
          text: 'Wallets are being processed. Please wait a moment and refresh again.'
        })
      }

    } catch (error) {
      console.error('Sync error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to sync wallets'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Your wallets should appear here after KYC approval. If they're not showing, click the button below to refresh.
        </AlertDescription>
      </Alert>
      
      <Button
        onClick={handleRefresh}
        disabled={isRefreshing || isSyncing}
        variant="outline"
        className="w-full gap-2"
      >
        <RefreshCcw className={`h-4 w-4 ${(isRefreshing || isSyncing) ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Checking wallets...' : isSyncing ? 'Creating wallets...' : 'Show My Wallets'}
      </Button>
      
      {message && (
        <Alert className={`mt-2 ${
          message.type === 'success' ? 'border-green-500' : 
          message.type === 'error' ? 'border-red-500' : 
          'border-blue-500'
        }`}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}