'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { RefreshCcw, Wallet, CheckCircle, XCircle, Info } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SyncWalletsButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncMessage(null)
    
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
        setSyncMessage({
          type: 'success',
          message: `Created ${data.results.created.length} new wallets: ${data.results.created.map(w => w.currency).join(', ')}`
        })
      } else if (data.results.existing.length === 4) {
        setSyncMessage({
          type: 'info',
          message: 'All wallets already created. You have wallets for: ' + data.results.existing.join(', ')
        })
      }

      if (data.results.errors.length > 0) {
        setSyncMessage({
          type: 'error',
          message: 'Some wallets failed: ' + data.results.errors.map(e => `${e.currency}: ${e.error}`).join(', ')
        })
      }

      // Reload the page to show new wallets if any were created
      if (data.results.created.length > 0) {
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }

    } catch (error) {
      console.error('Sync error:', error)
      setSyncMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {isSyncing ? (
          <>
            <RefreshCcw className="h-4 w-4 animate-spin" />
            Syncing wallets...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            Create Missing Wallets
          </>
        )}
      </Button>
      
      {syncMessage && (
        <Alert className={`mt-2 ${
          syncMessage.type === 'success' ? 'border-green-500' : 
          syncMessage.type === 'error' ? 'border-red-500' : 
          'border-blue-500'
        }`}>
          {syncMessage.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
          {syncMessage.type === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
          {syncMessage.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
          <AlertDescription>
            {syncMessage.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}