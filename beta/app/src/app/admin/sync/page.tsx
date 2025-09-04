'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function AdminSyncPage() {
  const [syncing, setSyncing] = useState(false)
  const [syncResults, setSyncResults] = useState<any[]>([])
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSync = async () => {
    setSyncing(true)
    setError('')
    setSyncResults([])

    try {
      const response = await fetch('/api/admin/sync-striga', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      const data = await response.json()
      setSyncResults(data.results || [])
    } catch (err) {
      setError('Failed to sync with Striga. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage system synchronization</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Striga User Synchronization</CardTitle>
          <CardDescription>
            Sync local user data with Striga to ensure KYC status and user IDs are up to date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={handleSync} 
              disabled={syncing}
              className="w-full"
              size="lg"
            >
              {syncing ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Sync with Striga
                </>
              )}
            </Button>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 mr-2" />
                  {error}
                </div>
              </div>
            )}

            {syncResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Sync Results:</h3>
                {syncResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{result.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.message}
                        </p>
                        {result.details && (
                          <div className="text-xs mt-1 space-y-1">
                            {result.details.strigaUserId && (
                              <p>Striga ID: {result.details.strigaUserId}</p>
                            )}
                            {result.details.kycStatus && (
                              <p>KYC Status: {result.details.kycStatus}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This will check all users in the local database against Striga 
                and update their user IDs and KYC status. Users must exist in Striga first.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}